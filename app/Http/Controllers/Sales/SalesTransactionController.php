<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesTransaction;
use App\Models\Store;
use App\Models\Product;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SalesTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesTransaction::with(['store', 'customer.customerDiscount', 'salesItems.product', 'payments.paymentMethod']);

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('transaction_number', 'like', "%{$request->search}%")
                  ->orWhere('reference_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($subQ) use ($request) {
                      $subQ->where('name', 'like', "%{$request->search}%");
                  });
            });
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('perPage', 15))
            ->withQueryString();

        $stores = Store::orderBy('name')->get();

        // Statistics
        $stats = [
            'total_transactions' => SalesTransaction::count(),
            'total_revenue' => SalesTransaction::where('status', 'completed')->sum('total_amount'),
            'today_transactions' => SalesTransaction::whereDate('created_at', today())->count(),
            'today_revenue' => SalesTransaction::whereDate('created_at', today())
                ->where('status', 'completed')
                ->sum('total_amount'),
        ];

        return Inertia::render('sales/transactions/index', [
            'transactions' => $transactions,
            'stores' => $stores,
            'stats' => $stats,
            'filters' => $request->only(['search', 'store_id', 'status', 'date_from', 'date_to', 'perPage']),
        ]);
    }

    public function create()
    {
        $stores = Store::where('is_active', true)->orderBy('name')->get();
        $customers = Customer::where('is_active', true)
            ->with('customerDiscount')
            ->orderBy('name')
            ->get();
        $products = Product::where('is_active', true)
            ->with(['category', 'inventories'])
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                // Add stock_quantity by summing all inventories
                $product->stock_quantity = $product->inventories->sum('quantity');
                // Add category_name for frontend compatibility
                $product->category_name = $product->category ? $product->category->name : '';
                return $product;
            });
        $discounts = Discount::where('is_active', true)->orderBy('name')->get();
        $paymentMethods = PaymentMethod::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('sales/transactions/create', [
            'stores' => $stores,
            'customers' => $customers,
            'products' => $products,
            'discounts' => $discounts,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'payments' => 'required|array|min:1',
            'payments.*.payment_method_id' => 'required|exists:payment_methods,id',
            'payments.*.amount' => 'required|numeric|min:0',
            'discount_id' => 'nullable|exists:discounts,id',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        
        $maxRetries = 5;
        $retryCount = 0;
        
        while ($retryCount < $maxRetries) {
            try {
                // Generate unique transaction number
                $date = date('Ymd');
                $lastTransaction = SalesTransaction::whereDate('created_at', today())
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->first();
                
                if ($lastTransaction) {
                    // Extract the last number from transaction_number (TR-YYYYMMDD-XXXX)
                    $lastNumber = (int) substr($lastTransaction->transaction_number, -4);
                    $newNumber = $lastNumber + 1;
                } else {
                    $newNumber = 1;
                }
                
                $transactionNumber = 'TR-' . $date . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
                
                // Double check uniqueness
                $exists = SalesTransaction::where('transaction_number', $transactionNumber)->exists();
                if ($exists) {
                    // If exists, increment and try again
                    $newNumber++;
                    $transactionNumber = 'TR-' . $date . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
                }

                // Calculate totals
                $subtotal = 0;
                foreach ($request->items as $item) {
                    $subtotal += $item['quantity'] * $item['unit_price'] - ($item['discount_amount'] ?? 0);
                }

                // Calculate discount
                $discountAmount = 0;
                if ($request->discount_id) {
                    $discount = Discount::find($request->discount_id);
                    if ($discount) {
                        if ($discount->type === 'percentage') {
                            $discountAmount = $subtotal * ($discount->value / 100);
                        } else {
                            $discountAmount = $discount->value;
                        }
                        
                        // Apply maximum discount limit
                        if ($discount->maximum_discount && $discountAmount > $discount->maximum_discount) {
                            $discountAmount = $discount->maximum_discount;
                        }
                    }
                }

                // Calculate customer discount
                $customerDiscountAmount = 0;
                $customerDiscountPercentage = 0;
                if ($request->customer_id) {
                    $customer = Customer::with('customerDiscount')->find($request->customer_id);
                    if ($customer && $customer->customerDiscount) {
                        $customerDiscountPercentage = $customer->customerDiscount->discount_percentage;
                        $customerDiscountAmount = $subtotal * ($customerDiscountPercentage / 100);
                        
                        // Apply minimum purchase check
                        if ($customer->customerDiscount->minimum_purchase > 0 && $subtotal < $customer->customerDiscount->minimum_purchase) {
                            $customerDiscountAmount = 0;
                            $customerDiscountPercentage = 0;
                        }
                        
                        // Apply maximum discount limit
                        if ($customer->customerDiscount->maximum_discount && $customerDiscountAmount > $customer->customerDiscount->maximum_discount) {
                            $customerDiscountAmount = $customer->customerDiscount->maximum_discount;
                        }
                    }
                }

                $taxAmount = 0; // No tax for now
                $totalAmount = $subtotal - $discountAmount - $customerDiscountAmount + $taxAmount;

                // Calculate payment fees
                $totalFees = 0;
                foreach ($request->payments as $payment) {
                    $paymentMethod = PaymentMethod::find($payment['payment_method_id']);
                    if ($paymentMethod) {
                        if ($paymentMethod->fee_percentage > 0) {
                            $totalFees += $payment['amount'] * ($paymentMethod->fee_percentage / 100);
                        }
                        if ($paymentMethod->fee_fixed > 0) {
                            $totalFees += $paymentMethod->fee_fixed;
                        }
                    }
                }

                // Create transaction
                $transaction = SalesTransaction::create([
                    'transaction_number' => $transactionNumber,
                    'reference_number' => $request->reference_number,
                    'store_id' => $request->store_id,
                    'customer_id' => $request->customer_id,
                    'user_id' => Auth::id(),
                    'discount_id' => $request->discount_id,
                    'subtotal_amount' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'customer_discount_amount' => $customerDiscountAmount,
                    'customer_discount_percentage' => $customerDiscountPercentage,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => array_sum(array_column($request->payments, 'amount')),
                    'change_amount' => max(0, array_sum(array_column($request->payments, 'amount')) - $totalAmount),
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'notes' => $request->notes,
                    'transaction_date' => now(),
                ]);

                // Create transaction items
                foreach ($request->items as $item) {
                    $transaction->salesItems()->create([
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => $item['discount_amount'] ?? 0,
                        'total_amount' => ($item['quantity'] * $item['unit_price']) - ($item['discount_amount'] ?? 0),
                    ]);

                    // Update product inventory
                    $product = Product::find($item['product_id']);
                    if ($product) {
                        // Find or create inventory record for this store
                        $inventory = $product->inventories()->where('store_id', $request->store_id)->first();
                        if ($inventory) {
                            $inventory->decrement('quantity', $item['quantity']);
                        }
                    }
                }

                // Create payment records
                foreach ($request->payments as $payment) {
                    $paymentMethod = PaymentMethod::find($payment['payment_method_id']);
                    $feeAmount = 0;
                    
                    if ($paymentMethod) {
                        if ($paymentMethod->fee_percentage > 0) {
                            $feeAmount += $payment['amount'] * ($paymentMethod->fee_percentage / 100);
                        }
                        if ($paymentMethod->fee_fixed > 0) {
                            $feeAmount += $paymentMethod->fee_fixed;
                        }
                    }

                    $transaction->payments()->create([
                        'payment_method_id' => $payment['payment_method_id'],
                        'amount' => $payment['amount'],
                        'fee_amount' => $feeAmount,
                        'reference_number' => $payment['reference_number'] ?? null,
                        'status' => 'completed',
                    ]);
                }

                // Update discount usage count if discount was applied
                if ($request->discount_id && $discountAmount > 0) {
                    $discount = Discount::find($request->discount_id);
                    if ($discount) {
                        $discount->increment('usage_count');
                        
                        // Auto-disable discount if usage limit is reached
                        if ($discount->usage_limit && $discount->usage_count >= $discount->usage_limit) {
                            $discount->update(['is_active' => false]);
                            Log::info("Discount {$discount->name} automatically disabled - usage limit reached");
                        }
                    }
                }

                // Update customer statistics if customer was selected
                if ($request->customer_id) {
                    $customer = Customer::find($request->customer_id);
                    if ($customer) {
                        $customer->updateTransactionStats($totalAmount);
                    }
                }

                DB::commit();

                return redirect()->route('sales.transactions.show', $transaction)
                    ->with('success', 'Transaksi berhasil dibuat');

            } catch (\Illuminate\Database\QueryException $e) {
                DB::rollback();
                
                // Check if it's a duplicate key error
                if (str_contains($e->getMessage(), 'duplicate key') || str_contains($e->getMessage(), 'Unique violation')) {
                    $retryCount++;
                    if ($retryCount < $maxRetries) {
                        Log::warning("Duplicate transaction number, retrying... Attempt: $retryCount");
                        continue;
                    }
                }
                
                Log::error('Database error creating transaction: ' . $e->getMessage());
                
                // For Inertia requests, return proper error response
                if (request()->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Terjadi kesalahan pada database. Silakan coba lagi.'
                    ], 422);
                }
                
                return back()->withInput()->withErrors([
                    'general' => 'Terjadi kesalahan pada database. Silakan coba lagi.'
                ]);
                
            } catch (\Exception $e) {
                DB::rollback();
                Log::error('Error creating transaction: ' . $e->getMessage());
                
                // For Inertia requests, return proper error response
                if (request()->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Terjadi kesalahan saat menyimpan transaksi: ' . $e->getMessage()
                    ], 422);
                }
                
                return back()->withInput()->withErrors([
                    'general' => 'Terjadi kesalahan saat menyimpan transaksi: ' . $e->getMessage()
                ]);
            }
        }
        
        // If we reach here, all retries failed
        Log::error('All retries failed for transaction creation');
        
        if (request()->header('X-Inertia')) {
            return response()->json([
                'message' => 'Gagal membuat transaksi setelah beberapa percobaan. Silakan coba lagi.'
            ], 422);
        }
        
        return back()->withInput()->withErrors([
            'general' => 'Gagal membuat transaksi setelah beberapa percobaan. Silakan coba lagi.'
        ]);
    }

    public function show(SalesTransaction $salesTransaction)
    {
        $salesTransaction->load(['store', 'customer.customerDiscount', 'user', 'salesItems.product', 'payments.paymentMethod', 'discount']);

        // Check if there are any approved returns for this transaction
        $hasApprovedReturns = \App\Models\SalesReturn::where('sales_transaction_id', $salesTransaction->id)
                                                    ->where('status', 'approved')
                                                    ->exists();

        // Check if there are any pending returns for this transaction
        $hasPendingReturns = \App\Models\SalesReturn::where('sales_transaction_id', $salesTransaction->id)
                                                   ->where('status', 'pending')
                                                   ->exists();

        return Inertia::render('sales/transactions/show', [
            'transaction' => $salesTransaction,
            'hasApprovedReturns' => $hasApprovedReturns,
            'hasPendingReturns' => $hasPendingReturns,
        ]);
    }

    public function edit(SalesTransaction $salesTransaction)
    {
        $salesTransaction->load(['store', 'customer', 'salesItems.product', 'payments.paymentMethod']);
        
        $stores = Store::where('is_active', true)->orderBy('name')->get();
        $customers = Customer::where('is_active', true)->orderBy('name')->get();
        $products = Product::where('is_active', true)->with('category')->orderBy('name')->get();
        $paymentMethods = PaymentMethod::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('sales/transactions/edit', [
            'transaction' => $salesTransaction,
            'stores' => $stores,
            'customers' => $customers,
            'products' => $products,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function update(Request $request, SalesTransaction $salesTransaction)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'customer_id' => 'nullable|exists:customers,id',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,completed,cancelled,refunded,voided',
        ]);

        // Only allow updates for transactions that are not completed or voided
        if (in_array($salesTransaction->status, ['completed', 'voided'])) {
            return back()->withErrors(['general' => 'Transaksi yang sudah selesai atau dibatalkan tidak dapat diubah.']);
        }

        DB::beginTransaction();
        
        try {
            $originalDiscountId = $salesTransaction->discount_id;
            $originalDiscountAmount = $salesTransaction->discount_amount;

            $salesTransaction->update([
                'store_id' => $request->store_id,
                'customer_id' => $request->customer_id,
                'notes' => $request->notes,
                'status' => $request->get('status', $salesTransaction->status),
            ]);

            // If discount was changed and original discount was applied, decrease old usage
            if ($originalDiscountId && $originalDiscountAmount > 0 && 
                ($originalDiscountId != $salesTransaction->discount_id || $salesTransaction->discount_amount == 0)) {
                
                $oldDiscount = Discount::find($originalDiscountId);
                if ($oldDiscount && $oldDiscount->usage_count > 0) {
                    $oldDiscount->decrement('usage_count');
                    
                    // Re-activate discount if it was auto-disabled
                    if (!$oldDiscount->is_active && $oldDiscount->usage_limit && $oldDiscount->usage_count < $oldDiscount->usage_limit) {
                        $oldDiscount->update(['is_active' => true]);
                        Log::info("Discount {$oldDiscount->name} re-activated after transaction update");
                    }
                }
            }

            DB::commit();

            return redirect()->route('sales.transactions.index')
                ->with('success', 'Transaksi berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error updating transaction: ' . $e->getMessage());
            
            return back()->withErrors([
                'general' => 'Terjadi kesalahan saat memperbarui transaksi: ' . $e->getMessage()
            ]);
        }
    }

    public function destroy(SalesTransaction $salesTransaction)
    {
        // Only allow deletion of transactions that are not completed or are voided
        if ($salesTransaction->status !== 'voided' && $salesTransaction->status !== 'draft') {
            return back()->withErrors(['general' => 'Hanya transaksi yang berstatus draft atau voided yang dapat dihapus.']);
        }

        DB::beginTransaction();
        
        try {
            // Decrease discount usage count if discount was applied
            if ($salesTransaction->discount_id && $salesTransaction->discount_amount > 0) {
                $discount = Discount::find($salesTransaction->discount_id);
                if ($discount && $discount->usage_count > 0) {
                    $discount->decrement('usage_count');
                    
                    // Re-activate discount if it was auto-disabled due to usage limit
                    if (!$discount->is_active && $discount->usage_limit && $discount->usage_count < $discount->usage_limit) {
                        $discount->update(['is_active' => true]);
                        Log::info("Discount {$discount->name} re-activated - usage count decreased below limit");
                    }
                }
            }

            // Restore inventory for each item
            foreach ($salesTransaction->salesItems as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $inventory = $product->inventories()->where('store_id', $salesTransaction->store_id)->first();
                    if ($inventory) {
                        $inventory->increment('quantity', $item->quantity);
                    }
                }
            }

            // Delete related records
            $salesTransaction->salesItems()->delete();
            $salesTransaction->payments()->delete();
            $salesTransaction->delete();

            DB::commit();

            return redirect()->route('sales.transactions.index')
                ->with('success', 'Transaksi berhasil dihapus dan stok dikembalikan.');

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error deleting transaction: ' . $e->getMessage());
            
            return back()->withErrors([
                'general' => 'Terjadi kesalahan saat menghapus transaksi: ' . $e->getMessage()
            ]);
        }
    }

    public function receipt(SalesTransaction $salesTransaction)
    {
        $salesTransaction->load(['store', 'customer', 'user', 'salesItems.product', 'payments.paymentMethod', 'discount']);

        return Inertia::render('sales/transactions/receipt', [
            'transaction' => $salesTransaction,
        ]);
    }

    public function void(SalesTransaction $salesTransaction)
    {
        // Only allow voiding of completed transactions
        if ($salesTransaction->status !== 'completed') {
            return back()->withErrors(['general' => 'Hanya transaksi yang telah selesai yang dapat dibatalkan.']);
        }

        // Check if transaction is already refunded
        if ($salesTransaction->status === 'refunded') {
            return back()->withErrors(['general' => 'Tidak dapat membatalkan transaksi yang sudah direfund.']);
        }

        // Check if there are any approved returns for this transaction
        $hasApprovedReturns = \App\Models\SalesReturn::where('sales_transaction_id', $salesTransaction->id)
                                                    ->where('status', 'approved')
                                                    ->exists();

        if ($hasApprovedReturns) {
            return back()->withErrors(['general' => 'Tidak dapat membatalkan transaksi yang sudah memiliki retur disetujui.']);
        }

        DB::beginTransaction();
        
        try {
            // Load relationships that we need
            $salesTransaction->load(['salesItems', 'payments', 'discount']);

            // Decrease discount usage count if discount was applied
            if ($salesTransaction->discount_id && $salesTransaction->discount_amount > 0) {
                $discount = Discount::find($salesTransaction->discount_id);
                if ($discount && $discount->usage_count > 0) {
                    $discount->decrement('usage_count');
                    
                    // Re-activate discount if it was auto-disabled due to usage limit
                    if (!$discount->is_active && $discount->usage_limit && $discount->usage_count < $discount->usage_limit) {
                        $discount->update(['is_active' => true]);
                        Log::info("Discount {$discount->name} re-activated after transaction void - usage count decreased below limit");
                    }
                }
            }

            // Restore inventory for each item
            foreach ($salesTransaction->salesItems as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $inventory = $product->inventories()->where('store_id', $salesTransaction->store_id)->first();
                    if ($inventory) {
                        $inventory->increment('quantity', $item->quantity);
                        Log::info("Restored inventory for product {$product->name}: +{$item->quantity}");
                    }
                }
            }

            // Update payment status - only for completed payments
            $completedPayments = $salesTransaction->payments()->where('status', 'completed')->get();
            foreach ($completedPayments as $payment) {
                $payment->update(['status' => 'voided']);
                Log::info("Payment {$payment->id} status updated to voided");
            }

            // Update transaction status
            $salesTransaction->update([
                'status' => 'voided',
                'voided_at' => now(),
                'voided_by' => Auth::id(),
                'void_reason' => request('void_reason', 'Manual void'),
            ]);

            Log::info("Transaction {$salesTransaction->transaction_number} voided successfully by user " . Auth::id());

            DB::commit();

            return redirect()->route('sales.transactions.index')
                ->with('success', 'Transaksi berhasil dibatalkan. Stok dan penggunaan diskon dikembalikan.');

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error voiding transaction: ' . $e->getMessage());
            Log::error('Transaction ID: ' . $salesTransaction->id);
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return back()->withErrors([
                'general' => 'Terjadi kesalahan saat membatalkan transaksi: ' . $e->getMessage()
            ]);
        }
    }
}
