<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDiscount;
use App\Models\Discount;
use App\Models\PaymentMethod;
use App\Models\SalesTransaction;
use App\Models\SalesItem;
use App\Models\SalesPayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CashierController extends Controller
{
    /**
     * Display the POS cashier interface
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Check if user has selected a store for this session
        if (!$user->current_store_id) {
            return redirect()->route('pos.select-store', ['from' => 'pos']);
        }
        
        $userStore = Store::find($user->current_store_id);
        
        // Check if user still has access to current store
        if (!$userStore || !$user->stores()->where('stores.id', $userStore->id)->exists()) {
            // User lost access or store doesn't exist, redirect to select store
            $user->update(['current_store_id' => null]);
            return redirect()->route('pos.select-store', ['from' => 'pos', 'reason' => 'access_changed']);
        }

        $search = $request->get('search', '');
        $categoryId = $request->get('category_id', '');

        // Get products with stock for the user's store
        $productsQuery = Product::with(['category', 'inventories' => function($query) use ($userStore) {
            $query->where('store_id', $userStore->id);
        }])
        ->whereHas('inventories', function($query) use ($userStore) {
            $query->where('store_id', $userStore->id)
                  ->where('quantity', '>', 0);
        });

        if ($search) {
            $productsQuery->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $productsQuery->where('category_id', $categoryId);
        }

        $products = $productsQuery->get()->map(function($product) {
            $inventory = $product->inventories->first();
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->sku,
                'barcode' => $product->barcode,
                'price' => $product->selling_price,
                'image' => $product->image,
                'category' => $product->category,
                'stock' => $inventory ? $inventory->quantity : 0,
            ];
        });

        // Get categories
        $categories = Category::active()->get();

        // Get customers with discount info (limit initial load)
        $customers = Customer::with('customerDiscount')
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(50) // Limit initial load for performance
            ->get();

        // Get customer discounts
        $customerDiscounts = CustomerDiscount::active()->get();

        // Get payment methods
        $paymentMethods = PaymentMethod::active()->get();

        // Get available discounts
        $discounts = Discount::where('is_active', true)->get();

        return Inertia::render('pos/cashier/index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'customerDiscounts' => $customerDiscounts,
            'paymentMethods' => $paymentMethods,
            'discounts' => $discounts,
            'store' => $userStore,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
            ],
        ])->with([
            'store' => $userStore,
        ]);
    }

    /**
     * Process transaction from POS
     */
    public function processTransaction(Request $request)
    {
        $user = Auth::user();
        $userStore = Store::first();
        
        if (!$userStore) {
            return response()->json(['error' => 'Store not found'], 404);
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'payments' => 'required|array|min:1',
            'payments.*.payment_method_id' => 'required|exists:payment_methods,id',
            'payments.*.amount' => 'required|numeric|min:0',
            'subtotal_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'customer_discount_amount' => 'nullable|numeric|min:0',
            'customer_discount_percentage' => 'nullable|numeric|min:0|max:100',
            'additional_discount_amount' => 'nullable|numeric|min:0',
            'discount_id' => 'nullable|exists:discounts,id',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'change_amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Generate transaction number
            $transactionNumber = $this->generateTransactionNumber();

            // Calculate customer discount if customer selected
            $customerDiscountAmount = 0;
            $customerDiscountPercentage = 0;
            
            if ($request->customer_id) {
                $customer = Customer::with('customerDiscount')->find($request->customer_id);
                if ($customer && $customer->customerDiscount) {
                    $subtotal = $request->subtotal_amount - ($request->discount_amount ?? 0);
                    if ($subtotal >= $customer->customerDiscount->minimum_purchase) {
                        $discountAmount = ($subtotal * $customer->customerDiscount->discount_percentage) / 100;
                        if ($customer->customerDiscount->maximum_discount) {
                            $discountAmount = min($discountAmount, $customer->customerDiscount->maximum_discount);
                        }
                        $customerDiscountAmount = $discountAmount;
                        $customerDiscountPercentage = $customer->customerDiscount->discount_percentage;
                    }
                }
            }

            // Create sales transaction
            $transaction = SalesTransaction::create([
                'transaction_number' => $transactionNumber,
                'store_id' => $userStore->id,
                'customer_id' => $request->customer_id,
                'user_id' => $user->id,
                'transaction_date' => now(),
                'subtotal_amount' => $request->subtotal_amount,
                'discount_amount' => $request->discount_amount ?? 0,
                'customer_discount_amount' => $customerDiscountAmount,
                'customer_discount_percentage' => $customerDiscountPercentage,
                'additional_discount_amount' => $request->additional_discount_amount ?? 0,
                'discount_id' => $request->discount_id,
                'tax_amount' => $request->tax_amount ?? 0,
                'total_amount' => $request->total_amount,
                'paid_amount' => $request->paid_amount,
                'change_amount' => $request->change_amount,
                'status' => 'completed',
                'payment_status' => 'paid',
            ]);

            // Create sales items
            foreach ($request->items as $item) {
                SalesItem::create([
                    'sales_transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'total_amount' => $item['quantity'] * $item['unit_price'] - ($item['discount_amount'] ?? 0),
                ]);

                // Update inventory
                $product = Product::find($item['product_id']);
                $inventory = $product->inventories()
                    ->where('store_id', $userStore->id)
                    ->first();

                if ($inventory) {
                    $oldQuantity = $inventory->quantity;
                    $newQuantity = $oldQuantity - $item['quantity'];
                    
                    $inventory->update(['quantity' => $newQuantity]);

                    // Create stock movement
                    $product->stockMovements()->create([
                        'store_id' => $userStore->id,
                        'user_id' => $user->id,
                        'type' => 'sale',
                        'quantity_before' => $oldQuantity,
                        'quantity_change' => -$item['quantity'],
                        'quantity_after' => $newQuantity,
                        'unit_cost' => $inventory->cost_price ?? 0,
                        'reference_type' => 'SalesTransaction',
                        'reference_id' => $transaction->id,
                        'movement_date' => now(),
                    ]);
                }
            }

            // Create sales payments
            foreach ($request->payments as $payment) {
                SalesPayment::create([
                    'sales_transaction_id' => $transaction->id,
                    'payment_method_id' => $payment['payment_method_id'],
                    'amount' => $payment['amount'],
                    'reference_number' => $payment['reference_number'] ?? null,
                    'fee_amount' => $payment['fee_amount'] ?? 0,
                    'payment_date' => now(),
                ]);
            }

            // Update discount usage if discount was applied
            if ($request->discount_id && $request->additional_discount_amount > 0) {
                $discount = Discount::find($request->discount_id);
                if ($discount) {
                    $discount->increment('usage_count');
                    
                    // Check if discount has usage limit and disable if reached
                    if ($discount->usage_limit && $discount->usage_count >= $discount->usage_limit) {
                        $discount->update(['is_active' => false]);
                    }
                }
            }

            DB::commit();

            // Load transaction with all necessary relationships
            $transaction->load(['customer', 'salesItems.product', 'payments.paymentMethod']);
            
            // Add store and cashier information
            $user = Auth::user();

            return response()->json([
                'success' => true,
                'message' => 'Transaction processed successfully',
                'transaction' => array_merge($transaction->toArray(), [
                    'cashier_name' => $user->name,
                    'store_name' => $userStore->name ?? 'Store',
                    'store_address' => $userStore->address ?? '',
                    'store_phone' => $userStore->phone ?? '',
                ]),
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process transaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Quick add customer from POS
     */
    public function quickAddCustomer(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'customer_discount_id' => 'nullable|exists:customer_discounts,id',
        ]);

        try {
            $customer = Customer::create([
                'name' => $request->name,
                'code' => $this->generateCustomerCode(),
                'phone' => $request->phone,
                'email' => $request->email,
                'customer_type' => 'regular',
                'customer_discount_id' => $request->customer_discount_id,
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            $customer->load('customerDiscount');

            return response()->json([
                'success' => true,
                'message' => 'Customer added successfully',
                'customer' => $customer,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add customer: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search customers for POS
     */
    public function searchCustomers(Request $request)
    {
        $search = $request->get('search', '');
        
        if (empty($search)) {
            // Return initial customers if no search
            $customers = Customer::with('customerDiscount')
                ->where('is_active', true)
                ->orderBy('name')
                ->limit(20)
                ->get();
        } else {
            // Search customers
            $customers = Customer::with('customerDiscount')
                ->where('is_active', true)
                ->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%");
                })
                ->orderBy('name')
                ->limit(20)
                ->get();
        }

        return response()->json([
            'customers' => $customers
        ]);
    }

    /**
     * Search products by barcode or name
     */
    public function searchProduct(Request $request)
    {
        $user = Auth::user();
        $userStore = Store::first();
        $search = $request->get('search', '');

        if (empty($search)) {
            return response()->json(['products' => []]);
        }

        $products = Product::with(['category', 'inventories' => function($query) use ($userStore) {
            $query->where('store_id', $userStore->id);
        }])
        ->whereHas('inventories', function($query) use ($userStore) {
            $query->where('store_id', $userStore->id)
                  ->where('quantity', '>', 0);
        })
        ->where(function($query) use ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
        })
        ->limit(10)
        ->get()
        ->map(function($product) {
            $inventory = $product->inventories->first();
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->sku,
                'barcode' => $product->barcode,
                'price' => $product->selling_price,
                'image' => $product->image,
                'category' => $product->category,
                'stock' => $inventory ? $inventory->quantity : 0,
            ];
        });

        return response()->json(['products' => $products]);
    }

    /**
     * Generate transaction number
     */
    private function generateTransactionNumber(): string
    {
        $prefix = 'TRX';
        $date = now()->format('Ymd');
        $sequence = SalesTransaction::whereDate('created_at', now())->count() + 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate customer code
     */
    private function generateCustomerCode(): string
    {
        $prefix = 'CUST';
        $date = now()->format('Ymd');
        $sequence = Customer::whereDate('created_at', now())->count() + 1;
        
        return $prefix . $date . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Show store selection page
     */
    public function selectStore(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $from = $request->get('from');
        $forceSelection = $request->get('force', false);
        
        // If coming from logout or forced selection, always show selection page
        if ($from === 'logout' || $forceSelection) {
            $user->update(['current_store_id' => null]);
        } else {
            // If user already has a store selected, redirect to cashier
            if ($user->current_store_id) {
                $currentStore = Store::find($user->current_store_id);
                if ($currentStore && $user->stores()->where('stores.id', $currentStore->id)->exists()) {
                    return redirect()->route('pos.cashier.index');
                }
                // If current store is invalid, reset it
                $user->update(['current_store_id' => null]);
            }
        }
        
        // Get stores assigned to this user
        $userStores = $user->stores()->get();
        
        // Only auto-select if user has one store AND not coming from logout/reset
        if ($userStores->count() === 1 && $from !== 'logout' && !$forceSelection) {
            $user->update(['current_store_id' => $userStores->first()->id]);
            return redirect()->route('pos.cashier.index');
        }

        return Inertia::render('pos/select-store', [
            'stores' => $userStores,
            'hasStores' => $userStores->count() > 0,
            'from' => $from,
            'canExit' => true, // Always allow exit
            'message' => $request->get('message')
        ]);
    }

    /**
     * Set current store for user
     */
    public function setStore(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id'
        ]);

        /** @var User $user */
        $user = Auth::user();
        
        // Verify user has access to this store
        if (!$user->stores()->where('stores.id', $request->store_id)->exists()) {
            return back();
        }

        $store = Store::find($request->store_id);
        $user->update(['current_store_id' => $request->store_id]);

        return redirect()->route('pos.cashier.index');
    }

    /**
     * Reset current store selection (for admin/logout)
     */
    public function resetStore(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $user->update(['current_store_id' => null]);

        $destination = $request->get('destination', 'select-store');
        
        if ($destination === 'dashboard' || $destination === 'home') {
            return redirect()->route('dashboard')->with('success', 'Berhasil keluar dari mode POS');
        }

        return redirect()->route('pos.select-store', [
            'from' => 'reset', 
            'force' => true,
            'message' => 'store_reset'
        ]);
    }

    /**
     * Exit POS mode and return to dashboard
     */
    public function exitPOS()
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Reset current store selection
        $user->update(['current_store_id' => null]);

        return redirect()->route('dashboard')->with('success', 'Berhasil keluar dari mode POS');
    }

    /**
     * Get transaction history for POS
     */
    public function transactionHistory(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Check if user has selected a store
        if (!$user->current_store_id) {
            return response()->json(['error' => 'Store not selected'], 400);
        }

        $query = SalesTransaction::with([
            'customer:id,name,code',
            'user:id,name',
            'salesItems:id,sales_transaction_id,quantity',
            'payments.paymentMethod:id,name'
        ])
        ->where('store_id', $user->current_store_id)
        ->whereIn('status', ['completed', 'voided']); // Only show completed and voided transactions

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('transaction_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($subQ) use ($request) {
                      $subQ->where('name', 'like', "%{$request->search}%")
                           ->orWhere('code', 'like', "%{$request->search}%");
                  });
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('transaction_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('transaction_date', '<=', $request->end_date);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Get transactions with pagination
        $transactions = $query->orderBy('transaction_date', 'desc')
            ->paginate($request->get('per_page', 10));

        // Add sales_items_count to each transaction
        $transactions->getCollection()->transform(function ($transaction) {
            $transaction->sales_items_count = $transaction->salesItems->count();
            return $transaction;
        });

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Get transaction detail for POS
     */
    public function transactionDetail($id)
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            
            // Check if user has selected a store
            if (!$user->current_store_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Store not selected'
                ], 400);
            }

            $transaction = SalesTransaction::with([
                'store:id,name,address,phone',
                'customer:id,name,code,phone,email',
                'user:id,name',
                'salesItems.product:id,name,sku',
                'payments.paymentMethod:id,name',
                'discount:id,name,type,value'
            ])
            ->where('store_id', $user->current_store_id)
            ->where('id', $id)
            ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in transactionDetail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
