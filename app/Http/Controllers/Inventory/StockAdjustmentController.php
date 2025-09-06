<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use App\Models\Store;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $storeId = $request->get('store_id', '');
        $status = $request->get('status', '');
        $type = $request->get('type', '');
        $reason = $request->get('reason', '');

        $adjustments = StockAdjustment::query()
            ->with(['store', 'createdBy', 'approvedBy'])
            ->withCount('items as items_count')
            ->when($search, function ($query, $search) {
                return $query->where('adjustment_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            })
            ->when($storeId, function ($query, $storeId) {
                return $query->where('store_id', $storeId);
            })
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($type, function ($query, $type) {
                return $query->where('type', $type);
            })
            ->when($reason, function ($query, $reason) {
                return $query->where('reason', $reason);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $stores = Store::where('is_active', true)->get();

        return Inertia::render('inventory/stock-adjustments/index', [
            'adjustments' => $adjustments,
            'stores' => $stores,
            'filters' => [
                'search' => $search,
                'store_id' => $storeId,
                'status' => $status,
                'type' => $type,
                'reason' => $reason,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $stores = Store::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with(['category', 'inventories'])->get();

        return Inertia::render('inventory/stock-adjustments/create', [
            'stores' => $stores,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'type' => 'required|in:increase,decrease',
            'reason' => 'required|in:stock_opname,damaged_goods,expired_goods,lost_goods,found_goods,correction,supplier_return,customer_return,other',
            'adjustment_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.adjusted_quantity' => 'required|integer|not_in:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::create([
                'adjustment_number' => $this->generateAdjustmentNumber(),
                'store_id' => $request->store_id,
                'created_by' => Auth::id(),
                'type' => $request->type,
                'reason' => $request->reason,
                'adjustment_date' => $request->adjustment_date,
                'notes' => $request->notes,
                'status' => 'draft',
            ]);

            foreach ($request->items as $itemData) {
                // Get current inventory
                $inventory = Inventory::where('store_id', $request->store_id)
                    ->where('product_id', $itemData['product_id'])
                    ->first();

                $currentQuantity = $inventory ? $inventory->quantity : 0;
                $adjustedQuantity = (int) $itemData['adjusted_quantity'];
                
                // Make sure adjustment quantity is negative for decrease type
                if ($request->type === 'decrease' && $adjustedQuantity > 0) {
                    $adjustedQuantity = -$adjustedQuantity;
                }

                $newQuantity = $currentQuantity + $adjustedQuantity;
                
                // Prevent negative stock
                if ($newQuantity < 0) {
                    throw new \Exception("Stok tidak boleh negatif untuk produk: " . $itemData['product_id']);
                }

                $product = Product::find($itemData['product_id']);
                $unitCost = $inventory && $inventory->average_cost > 0 
                    ? $inventory->average_cost 
                    : ($inventory && $inventory->last_cost > 0 
                        ? $inventory->last_cost 
                        : $product->selling_price);

                StockAdjustmentItem::create([
                    'stock_adjustment_id' => $adjustment->id,
                    'product_id' => $itemData['product_id'],
                    'current_quantity' => $currentQuantity,
                    'adjusted_quantity' => $adjustedQuantity,
                    'new_quantity' => $newQuantity,
                    'unit_cost' => $unitCost,
                    'total_value_impact' => $adjustedQuantity * $unitCost,
                    'notes' => $itemData['notes'],
                ]);
            }

            $adjustment->calculateTotalValueImpact();

            DB::commit();

            return redirect()->route('inventory.stock-adjustments.show', $adjustment)
                ->with('success', 'Stock adjustment berhasil dibuat.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to create stock adjustment: ' . $e->getMessage());
        }
    }

    public function show(StockAdjustment $stockAdjustment)
    {
        $stockAdjustment->load([
            'store',
            'createdBy',
            'approvedBy',
            'items.product.category'
        ]);

        return Inertia::render('inventory/stock-adjustments/show', [
            'adjustment' => $stockAdjustment,
        ]);
    }

    public function edit(StockAdjustment $stockAdjustment)
    {
        if (!$stockAdjustment->canBeEdited()) {
            return back()->with('error', 'Stock adjustment cannot be edited in current status');
        }

        $stockAdjustment->load(['items.product']);
        $stores = Store::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with(['category', 'inventories'])->get();

        return Inertia::render('inventory/stock-adjustments/edit', [
            'adjustment' => $stockAdjustment,
            'stores' => $stores,
            'products' => $products,
        ]);
    }

    public function update(Request $request, StockAdjustment $stockAdjustment)
    {
        if (!$stockAdjustment->canBeEdited()) {
            return back()->with('error', 'Stock adjustment cannot be updated in current status');
        }

        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'type' => 'required|in:increase,decrease',
            'reason' => 'required|in:stock_opname,damaged_goods,expired_goods,lost_goods,found_goods,correction,supplier_return,customer_return,other',
            'adjustment_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.adjusted_quantity' => 'required|integer|not_in:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $stockAdjustment->update([
                'store_id' => $request->store_id,
                'type' => $request->type,
                'reason' => $request->reason,
                'adjustment_date' => $request->adjustment_date,
                'notes' => $request->notes,
            ]);

            // Delete existing items
            $stockAdjustment->items()->delete();

            // Create new items
            foreach ($request->items as $itemData) {
                $inventory = Inventory::where('store_id', $request->store_id)
                    ->where('product_id', $itemData['product_id'])
                    ->first();

                $currentQuantity = $inventory ? $inventory->quantity : 0;
                $adjustedQuantity = (int) $itemData['adjusted_quantity'];
                
                if ($request->type === 'decrease' && $adjustedQuantity > 0) {
                    $adjustedQuantity = -$adjustedQuantity;
                }

                $newQuantity = $currentQuantity + $adjustedQuantity;
                
                if ($newQuantity < 0) {
                    throw new \Exception("Stok tidak boleh negatif untuk produk: " . $itemData['product_id']);
                }

                $product = Product::find($itemData['product_id']);
                $unitCost = $inventory && $inventory->average_cost > 0 
                    ? $inventory->average_cost 
                    : ($inventory && $inventory->last_cost > 0 
                        ? $inventory->last_cost 
                        : $product->selling_price);

                StockAdjustmentItem::create([
                    'stock_adjustment_id' => $stockAdjustment->id,
                    'product_id' => $itemData['product_id'],
                    'current_quantity' => $currentQuantity,
                    'adjusted_quantity' => $adjustedQuantity,
                    'new_quantity' => $newQuantity,
                    'unit_cost' => $unitCost,
                    'total_value_impact' => $adjustedQuantity * $unitCost,
                    'notes' => $itemData['notes'],
                ]);
            }

            $stockAdjustment->calculateTotalValueImpact();

            DB::commit();

            return redirect()->route('inventory.stock-adjustments.show', $stockAdjustment)
                ->with('success', 'Stock adjustment berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to update stock adjustment: ' . $e->getMessage());
        }
    }

    public function destroy(StockAdjustment $stockAdjustment)
    {
        if (!$stockAdjustment->canBeDeleted()) {
            return back()->with('error', 'Stock adjustment cannot be deleted in current status');
        }

        $stockAdjustment->delete();

        return redirect()->route('inventory.stock-adjustments.index')
            ->with('success', 'Stock adjustment berhasil dihapus.');
    }

    public function approve(Request $request, StockAdjustment $stockAdjustment)
    {
        if (!$stockAdjustment->canBeApproved()) {
            return back()->with('error', 'Stock adjustment cannot be approved');
        }

        DB::beginTransaction();
        try {
            // Update stock adjustment
            $stockAdjustment->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Apply adjustments to inventory
            foreach ($stockAdjustment->items as $item) {
                $inventory = Inventory::where('store_id', $stockAdjustment->store_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($inventory) {
                    $oldQuantity = $inventory->quantity;
                    $newQuantity = $item->new_quantity;
                    
                    $inventory->update([
                        'quantity' => $newQuantity,
                    ]);

                    // Create stock movement
                    $item->product->stockMovements()->create([
                        'store_id' => $stockAdjustment->store_id,
                        'user_id' => Auth::id(),
                        'type' => 'adjustment',
                        'quantity_before' => $oldQuantity,
                        'quantity_change' => $item->adjusted_quantity,
                        'quantity_after' => $newQuantity,
                        'unit_cost' => $item->unit_cost,
                        'reference_type' => 'StockAdjustment',
                        'reference_id' => $stockAdjustment->id,
                        'movement_date' => $stockAdjustment->adjustment_date,
                        'notes' => $stockAdjustment->formatted_reason . ': ' . ($item->notes ?: $stockAdjustment->notes),
                    ]);
                } else {
                    // Create new inventory if doesn't exist and it's an increase
                    if ($item->adjusted_quantity > 0) {
                        Inventory::create([
                            'store_id' => $stockAdjustment->store_id,
                            'product_id' => $item->product_id,
                            'quantity' => $item->adjusted_quantity,
                            'minimum_stock' => 0,
                            'maximum_stock' => 1000,
                            'average_cost' => $item->unit_cost,
                            'last_cost' => $item->unit_cost,
                        ]);

                        // Create stock movement
                        $item->product->stockMovements()->create([
                            'store_id' => $stockAdjustment->store_id,
                            'user_id' => Auth::id(),
                            'type' => 'adjustment',
                            'quantity_before' => 0,
                            'quantity_change' => $item->adjusted_quantity,
                            'quantity_after' => $item->adjusted_quantity,
                            'unit_cost' => $item->unit_cost,
                            'reference_type' => 'StockAdjustment',
                            'reference_id' => $stockAdjustment->id,
                            'movement_date' => $stockAdjustment->adjustment_date,
                            'notes' => $stockAdjustment->formatted_reason . ': ' . ($item->notes ?: $stockAdjustment->notes),
                        ]);
                    }
                }
            }

            DB::commit();

            return back()->with('success', 'Stock adjustment berhasil disetujui dan stok telah diperbarui.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to approve stock adjustment: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, StockAdjustment $stockAdjustment)
    {
        if ($stockAdjustment->status !== 'draft') {
            return back()->with('error', 'Stock adjustment cannot be rejected');
        }

        $stockAdjustment->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Stock adjustment berhasil ditolak.');
    }

    private function generateAdjustmentNumber(): string
    {
        $prefix = 'ADJ';
        $date = now()->format('Ymd');
        $sequence = StockAdjustment::whereDate('created_at', now())->count() + 1;
        
        return $prefix . $date . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }
}
