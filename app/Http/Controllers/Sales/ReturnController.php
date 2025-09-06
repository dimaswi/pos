<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesReturn;
use App\Models\SalesTransaction;
use App\Models\Store;
use App\Models\SalesItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesReturn::query()
            ->with(['salesTransaction.customer', 'store', 'processedBy', 'returnItems'])
            ->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('return_number', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhereHas('salesTransaction', function ($sq) use ($search) {
                      $sq->where('transaction_number', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by store
        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('return_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('return_date', '<=', $request->date_to);
        }

        $returns = $query->paginate($request->get('perPage', 15))
                        ->withQueryString();

        // Add permission flags to each return
        $returns->getCollection()->transform(function ($return) {
            $return->can_be_edited = $return->canBeEdited();
            $return->can_be_deleted = $return->canBeDeleted();
            $return->can_be_approved = $return->canBeApproved();
            $return->can_be_rejected = $return->canBeRejected();
            $return->total_items = $return->total_items; // Uses accessor
            $return->status_badge = $return->status_badge; // Uses accessor
            return $return;
        });

        // Get statistics
        $stats = [
            'total_returns' => SalesReturn::count(),
            'pending_returns' => SalesReturn::where('status', 'pending')->count(),
            'approved_returns' => SalesReturn::where('status', 'approved')->count(),
            'total_refund_amount' => SalesReturn::where('status', 'approved')->sum('refund_amount'),
        ];

        $stores = Store::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sales/returns/index', [
            'returns' => $returns,
            'stores' => $stores,
            'stats' => $stats,
            'filters' => $request->only(['search', 'store_id', 'status', 'date_from', 'date_to', 'perPage']),
        ]);
    }

    public function create(Request $request)
    {
        $stores = Store::where('is_active', true)->get(['id', 'name']);
        
        // If transaction_id is provided, get transaction details
        $transaction = null;
        if ($request->filled('transaction_id')) {
            $transaction = SalesTransaction::with(['salesItems.product', 'store', 'customer'])
                                          ->findOrFail($request->transaction_id);
        }

        return Inertia::render('sales/returns/create', [
            'stores' => $stores,
            'transaction' => $transaction,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sales_transaction_id' => 'required|exists:sales_transactions,id',
            'store_id' => 'required|exists:stores,id',
            'return_date' => 'required|date',
            'reason' => 'required|string|max:1000',
            'return_items' => 'required|array|min:1',
            'return_items.*.sales_item_id' => 'required|exists:sales_items,id',
            'return_items.*.quantity' => 'required|integer|min:1',
            'return_items.*.reason' => 'required|string|max:500',
            'return_items.*.condition' => 'required|in:good,damaged,defective',
        ]);

        DB::beginTransaction();
        try {
            $transaction = SalesTransaction::findOrFail($request->sales_transaction_id);
            
            // Check if transaction is eligible for return
            if ($transaction->status === 'voided') {
                return back()->with('error', 'Tidak dapat membuat retur untuk transaksi yang dibatalkan.');
            }
            
            if ($transaction->status !== 'completed') {
                return back()->with('error', 'Transaksi harus selesai untuk membuat retur.');
            }
            
            // Check return period (30 days)
            $daysSinceTransaction = now()->diffInDays($transaction->transaction_date);
            if ($daysSinceTransaction > 30) {
                return back()->with('error', 'Transaksi sudah melewati periode retur (30 hari).');
            }
            
            // Check existing returns and validate availability
            $existingReturns = SalesReturn::where('sales_transaction_id', $request->sales_transaction_id)
                                        ->where('status', '!=', 'rejected')
                                        ->with('returnItems')
                                        ->get();
            
            $returnedItemsCount = [];
            foreach ($existingReturns as $return) {
                foreach ($return->returnItems as $item) {
                    $salesItemId = $item->sales_item_id;
                    $returnedItemsCount[$salesItemId] = ($returnedItemsCount[$salesItemId] ?? 0) + $item->quantity;
                }
            }
            
            // Validate each return item for availability
            foreach ($request->return_items as $item) {
                $salesItem = SalesItem::with('product')->findOrFail($item['sales_item_id']);
                $alreadyReturned = $returnedItemsCount[$item['sales_item_id']] ?? 0;
                $availableQuantity = $salesItem->quantity - $alreadyReturned;
                
                if ($item['quantity'] > $availableQuantity) {
                    return back()->with('error', "Jumlah retur untuk produk {$salesItem->product->name} melebihi yang tersedia. Tersedia: {$availableQuantity}");
                }
                
                if ($availableQuantity <= 0) {
                    return back()->with('error', "Produk {$salesItem->product->name} sudah tidak tersedia untuk retur.");
                }
            }
            
            // Check if there are pending returns for this transaction
            $pendingReturns = $existingReturns->where('status', 'pending');
            if ($pendingReturns->count() > 0) {
                return back()->with('error', 'Masih ada retur pending untuk transaksi ini. Selesaikan retur sebelumnya terlebih dahulu.');
            }
            
            // Generate return number
            $returnNumber = $this->generateReturnNumber();
            
            // Calculate refund amount
            $refundAmount = 0;
            foreach ($request->return_items as $item) {
                $salesItem = SalesItem::findOrFail($item['sales_item_id']);
                $unitRefund = $salesItem->unit_price - $salesItem->discount_amount;
                $refundAmount += $unitRefund * $item['quantity'];
            }

            // Create return record
            $return = SalesReturn::create([
                'return_number' => $returnNumber,
                'sales_transaction_id' => $request->sales_transaction_id,
                'store_id' => $request->store_id,
                'return_date' => $request->return_date,
                'reason' => $request->reason,
                'refund_amount' => $refundAmount,
                'status' => 'pending',
                'created_by' => Auth::user()->id,
            ]);

            // Create return items
            foreach ($request->return_items as $item) {
                $salesItem = SalesItem::findOrFail($item['sales_item_id']);
                $unitRefund = $salesItem->unit_price - $salesItem->discount_amount;
                
                $return->returnItems()->create([
                    'sales_item_id' => $item['sales_item_id'],
                    'product_id' => $salesItem->product_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $salesItem->unit_price,
                    'refund_amount' => $unitRefund * $item['quantity'],
                    'reason' => $item['reason'],
                    'condition' => $item['condition'],
                ]);
            }

            DB::commit();

            return redirect()->route('sales.returns.index')
                            ->with('success', 'Return request created successfully.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to create return request: ' . $e->getMessage());
        }
    }

    public function show(SalesReturn $return)
    {
        $return->load([
            'salesTransaction.customer',
            'salesTransaction.store',
            'salesTransaction.user',
            'store',
            'returnItems.product',
            'returnItems.salesItem',
            'createdBy',
            'processedBy'
        ]);

        return Inertia::render('sales/returns/show', [
            'return' => $return,
        ]);
    }

    public function edit(SalesReturn $return)
    {
        if ($return->status !== 'pending') {
            return back()->with('error', 'Only pending returns can be edited.');
        }

        $return->load(['returnItems.product', 'salesTransaction.salesItems.product', 'store', 'salesTransaction.customer']);
        $stores = Store::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sales/returns/edit', [
            'return' => $return,
            'stores' => $stores,
        ]);
    }

    public function update(Request $request, SalesReturn $return)
    {
        if ($return->status !== 'pending') {
            return back()->with('error', 'Only pending returns can be updated.');
        }

        $request->validate([
            'return_date' => 'required|date',
            'reason' => 'required|string|max:1000',
            'return_items' => 'required|array|min:1',
            'return_items.*.id' => 'required|exists:return_items,id',
            'return_items.*.quantity' => 'required|integer|min:1',
            'return_items.*.reason' => 'required|string|max:500',
            'return_items.*.condition' => 'required|in:good,damaged,defective',
        ]);

        DB::beginTransaction();
        try {
            // Calculate new refund amount
            $refundAmount = 0;
            foreach ($request->return_items as $item) {
                $returnItem = $return->returnItems()->findOrFail($item['id']);
                $unitRefund = $returnItem->unit_price;
                $refundAmount += $unitRefund * $item['quantity'];
            }

            // Update return
            $return->update([
                'return_date' => $request->return_date,
                'reason' => $request->reason,
                'refund_amount' => $refundAmount,
            ]);

            // Update return items
            foreach ($request->return_items as $item) {
                $returnItem = $return->returnItems()->findOrFail($item['id']);
                $unitRefund = $returnItem->unit_price;
                
                $returnItem->update([
                    'quantity' => $item['quantity'],
                    'refund_amount' => $unitRefund * $item['quantity'],
                    'reason' => $item['reason'],
                    'condition' => $item['condition'],
                ]);
            }

            DB::commit();

            return redirect()->route('sales.returns.index')
                            ->with('success', 'Return updated successfully.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to update return: ' . $e->getMessage());
        }
    }

    public function destroy(SalesReturn $return)
    {
        if ($return->status !== 'pending') {
            return back()->with('error', 'Only pending returns can be deleted.');
        }

        $return->delete();

        return redirect()->route('sales.returns.index')
                        ->with('success', 'Return deleted successfully.');
    }

    public function approve(SalesReturn $return)
    {
        if ($return->status !== 'pending') {
            return back()->with('error', 'Only pending returns can be approved.');
        }

        DB::beginTransaction();
        try {
            // Load the related transaction
            $return->load('salesTransaction');
            $transaction = $return->salesTransaction;

            // Update return status
            $return->update([
                'status' => 'approved',
                'processed_by' => Auth::user()->id,
                'processed_at' => now(),
            ]);

            // Update inventory for returned items
            foreach ($return->returnItems as $returnItem) {
                if ($returnItem->condition === 'good') {
                    // Only add back to inventory if condition is good
                    $inventory = Inventory::where('store_id', $return->store_id)
                                         ->where('product_id', $returnItem->product_id)
                                         ->first();
                    
                    if ($inventory) {
                        $inventory->increment('quantity', $returnItem->quantity);
                    }
                }
            }

            // Check if this is a full return and decrease discount usage if applicable
            $totalReturnedItems = $return->returnItems->sum('quantity');
            $totalOriginalItems = $transaction->salesItems->sum('quantity');
            
            // If this is a significant return (>= 50% of original items) and discount was used
            if ($totalReturnedItems >= ($totalOriginalItems * 0.5) && 
                $transaction->discount_id && 
                $transaction->discount_amount > 0) {
                
                $discount = \App\Models\Discount::find($transaction->discount_id);
                if ($discount && $discount->usage_count > 0) {
                    $discount->decrement('usage_count');
                    
                    // Re-activate discount if it was auto-disabled due to usage limit
                    if (!$discount->is_active && $discount->usage_limit && $discount->usage_count < $discount->usage_limit) {
                        $discount->update(['is_active' => true]);
                        \Illuminate\Support\Facades\Log::info("Discount {$discount->name} re-activated after return approval - usage count decreased below limit");
                    }
                }
            }

            // Update transaction status based on return percentage
            $returnPercentage = ($totalReturnedItems / $totalOriginalItems) * 100;
            
            if ($returnPercentage >= 100) {
                // Full return - mark transaction as refunded
                $transaction->update(['status' => 'refunded']);
            } else if ($returnPercentage >= 50) {
                // Significant return - mark as partially refunded
                $transaction->update(['status' => 'refunded']);
            }
            // For partial returns < 50%, keep status as completed

            DB::commit();

            return back()->with('success', 'Return approved successfully.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to approve return: ' . $e->getMessage());
        }
    }

    public function reject(SalesReturn $return)
    {
        if ($return->status !== 'pending') {
            return back()->with('error', 'Only pending returns can be rejected.');
        }

        $return->update([
            'status' => 'rejected',
            'processed_by' => Auth::user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Return rejected successfully.');
    }

    public function checkExisting(Request $request)
    {
        try {
            $request->validate([
                'transaction_number' => 'required|string',
            ]);

            $transaction = SalesTransaction::where('transaction_number', $request->transaction_number)->first();
            
            if (!$transaction) {
                return response()->json([
                    'exists' => false,
                    'message' => 'Transaksi tidak ditemukan'
                ]);
            }

            $existingReturn = SalesReturn::where('sales_transaction_id', $transaction->id)
                                       ->where('status', 'pending')
                                       ->first();

            return response()->json([
                'exists' => $existingReturn ? true : false,
                'message' => $existingReturn ? 'Sudah ada retur pending untuk transaksi ini' : 'Tidak ada retur pending'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'exists' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generateReturnNumber(): string
    {
        $prefix = 'RTN';
        $date = now()->format('Ymd');
        $sequence = SalesReturn::whereDate('created_at', today())->count() + 1;
        
        return $prefix . $date . sprintf('%04d', $sequence);
    }

    public function getTransaction(Request $request)
    {
        $request->validate([
            'transaction_number' => 'required|string',
        ]);

        $transaction = SalesTransaction::with(['salesItems.product', 'store', 'customer'])
                                      ->where('transaction_number', $request->transaction_number)
                                      ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.'
            ]);
        }

        // Check if transaction is voided
        if ($transaction->status === 'voided') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat membuat retur untuk transaksi yang dibatalkan.'
            ]);
        }

        // Check if transaction is completed
        if ($transaction->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi harus selesai untuk membuat retur.'
            ]);
        }

        // Check if transaction is eligible for return (within return period, etc.)
        $daysSinceTransaction = now()->diffInDays($transaction->transaction_date);
        if ($daysSinceTransaction > 30) { // 30 days return policy
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah melewati periode retur (30 hari).'
            ]);
        }

        // Check if there are items already returned
        $existingReturns = SalesReturn::where('sales_transaction_id', $transaction->id)
                                    ->where('status', '!=', 'rejected')
                                    ->with('returnItems')
                                    ->get();

        $returnedItemsCount = [];
        foreach ($existingReturns as $return) {
            foreach ($return->returnItems as $item) {
                $salesItemId = $item->sales_item_id;
                $returnedItemsCount[$salesItemId] = ($returnedItemsCount[$salesItemId] ?? 0) + $item->quantity;
            }
        }

        // Update sales items with available quantity for return
        $transaction->sales_items = $transaction->salesItems->map(function ($item) use ($returnedItemsCount) {
            $item->available_for_return = $item->quantity - ($returnedItemsCount[$item->id] ?? 0);
            return $item;
        });

        return response()->json([
            'success' => true,
            'transaction' => $transaction,
            'existing_returns_count' => count($existingReturns)
        ]);
    }
}
