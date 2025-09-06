<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Update average cost for a product inventory based on stock movements
     */
    public function updateAverageCost(Product $product, int $storeId): void
    {
        $inventory = Inventory::where('product_id', $product->id)
            ->where('store_id', $storeId)
            ->first();

        if (!$inventory) {
            return;
        }

        // Get all purchase movements for this product and store
        $purchaseMovements = StockMovement::where('product_id', $product->id)
            ->where('store_id', $storeId)
            ->where('type', 'purchase')
            ->where('quantity_change', '>', 0)
            ->orderBy('movement_date', 'asc')
            ->get();

        if ($purchaseMovements->isEmpty()) {
            // If no purchase movements, use the product's purchase price
            $inventory->update(['average_cost' => $product->purchase_price]);
            return;
        }

        // Calculate weighted average cost
        $totalValue = 0;
        $totalQuantity = 0;

        foreach ($purchaseMovements as $movement) {
            $cost = $movement->unit_cost ?? $product->purchase_price;
            $totalValue += $movement->quantity_change * $cost;
            $totalQuantity += $movement->quantity_change;
        }

        $averageCost = $totalQuantity > 0 ? $totalValue / $totalQuantity : $product->purchase_price;

        $inventory->update(['average_cost' => $averageCost]);

        Log::info('Average cost updated', [
            'product_id' => $product->id,
            'store_id' => $storeId,
            'average_cost' => $averageCost,
            'total_value' => $totalValue,
            'total_quantity' => $totalQuantity
        ]);
    }

    /**
     * Update average cost for all stores of a product
     */
    public function updateAverageCostAllStores(Product $product): void
    {
        $inventories = $product->inventories;
        
        foreach ($inventories as $inventory) {
            $this->updateAverageCost($product, $inventory->store_id);
        }
    }

    /**
     * Recalculate average cost for all products in a store
     */
    public function recalculateAverageCostForStore(int $storeId): void
    {
        $inventories = Inventory::where('store_id', $storeId)
            ->with('product')
            ->get();

        foreach ($inventories as $inventory) {
            $this->updateAverageCost($inventory->product, $storeId);
        }
    }

    /**
     * Handle inventory update when receiving purchase order
     */
    public function receivePurchase(Product $product, int $storeId, float $quantity, float $unitCost): void
    {
        DB::transaction(function () use ($product, $storeId, $quantity, $unitCost) {
            // Update inventory quantity
            $inventory = Inventory::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'store_id' => $storeId,
                ],
                [
                    'quantity' => 0,
                    'minimum_stock' => $product->minimum_stock,
                    'average_cost' => $unitCost,
                ]
            );

            $oldQuantity = $inventory->quantity;
            $newQuantity = $oldQuantity + $quantity;

            $inventory->update([
                'quantity' => $newQuantity,
                'last_cost' => $unitCost,
                'last_restock_date' => now(),
            ]);

            // Create stock movement record
            StockMovement::create([
                'product_id' => $product->id,
                'store_id' => $storeId,
                'user_id' => Auth::id(),
                'type' => 'purchase',
                'quantity_before' => $oldQuantity,
                'quantity_change' => $quantity,
                'quantity_after' => $newQuantity,
                'unit_cost' => $unitCost,
                'reference_type' => 'PurchaseOrder',
                'movement_date' => now(),
                'notes' => 'Purchase order received'
            ]);

            // Update average cost based on all purchase movements
            $this->updateAverageCost($product, $storeId);
        });
    }
}
