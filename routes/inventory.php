<?php

use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\PurchaseOrderController;
use App\Http\Controllers\Inventory\StockAdjustmentController;
use App\Http\Controllers\Inventory\StockTransferController;
use App\Http\Controllers\Inventory\MinimumStockAlertController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Inventory Management Routes
    Route::prefix('inventory')->name('inventory.')->group(function () {
        // Inventory Stock Routes
        Route::get('/', [InventoryController::class, 'index'])->name('index')->middleware('permission:inventory.view');
        Route::get('/create', [InventoryController::class, 'create'])->name('create')->middleware('permission:inventory.create');
        Route::post('/create', [InventoryController::class, 'store'])->name('store')->middleware('permission:inventory.create');
        Route::get('/low-stock', [InventoryController::class, 'lowStock'])->name('low-stock')->middleware('permission:inventory.view');
        Route::get('/stock-adjustment', [InventoryController::class, 'stockAdjustmentForm'])->name('stock-adjustment')->middleware('permission:inventory.edit');
        Route::get('/show/{inventory}', [InventoryController::class, 'show'])->name('show')->middleware('permission:inventory.view');
        Route::get('/edit/{inventory}', [InventoryController::class, 'edit'])->name('edit')->middleware('permission:inventory.edit');
        Route::put('/update/{inventory}', [InventoryController::class, 'update'])->name('update')->middleware('permission:inventory.edit');
        Route::post('/stock-adjustment/{inventory}', [InventoryController::class, 'stockAdjustment'])->name('stock-adjustment.store')->middleware('permission:inventory.edit');
        
        // Purchase Order Routes
        Route::prefix('purchase-orders')->name('purchase-orders.')->group(function () {
            Route::get('/', [PurchaseOrderController::class, 'index'])->name('index')->middleware('permission:purchase-order.view');
            Route::get('/create', [PurchaseOrderController::class, 'create'])->name('create')->middleware('permission:purchase-order.create');
            Route::post('/', [PurchaseOrderController::class, 'store'])->name('store')->middleware('permission:purchase-order.create');
            Route::get('/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('show')->middleware('permission:purchase-order.view');
            Route::get('/{purchaseOrder}/edit', [PurchaseOrderController::class, 'edit'])->name('edit')->middleware('permission:purchase-order.edit');
            Route::put('/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->name('update')->middleware('permission:purchase-order.edit');
            Route::delete('/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('destroy')->middleware('permission:purchase-order.delete');
            Route::post('/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit'])->name('submit')->middleware('permission:purchase-order.edit');
            Route::post('/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('approve')->middleware('permission:purchase-order.approve');
            Route::post('/{purchaseOrder}/reject', [PurchaseOrderController::class, 'reject'])->name('reject')->middleware('permission:purchase-order.reject');
            Route::get('/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receiveForm'])->name('receive.form')->middleware('permission:purchase-order.edit');
            Route::post('/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('receive')->middleware('permission:purchase-order.edit');
            Route::get('/{purchaseOrder}/tracking', [PurchaseOrderController::class, 'tracking'])->name('tracking')->middleware('permission:purchase-order.view');
        });
        
        // Stock Adjustment Routes
        Route::prefix('stock-adjustments')->name('stock-adjustments.')->group(function () {
            Route::get('/', [StockAdjustmentController::class, 'index'])->name('index')->middleware('permission:stock-adjustment.view');
            Route::get('/create', [StockAdjustmentController::class, 'create'])->name('create')->middleware('permission:stock-adjustment.create');
            Route::post('/', [StockAdjustmentController::class, 'store'])->name('store')->middleware('permission:stock-adjustment.create');
            Route::get('/{stockAdjustment}', [StockAdjustmentController::class, 'show'])->name('show')->middleware('permission:stock-adjustment.view');
            Route::get('/{stockAdjustment}/edit', [StockAdjustmentController::class, 'edit'])->name('edit')->middleware('permission:stock-adjustment.edit');
            Route::put('/{stockAdjustment}', [StockAdjustmentController::class, 'update'])->name('update')->middleware('permission:stock-adjustment.edit');
            Route::delete('/{stockAdjustment}', [StockAdjustmentController::class, 'destroy'])->name('destroy')->middleware('permission:stock-adjustment.delete');
            Route::post('/{stockAdjustment}/approve', [StockAdjustmentController::class, 'approve'])->name('approve')->middleware('permission:stock-adjustment.approve');
            Route::post('/{stockAdjustment}/reject', [StockAdjustmentController::class, 'reject'])->name('reject')->middleware('permission:stock-adjustment.reject');
        });
        
        // Stock Transfer Routes
        Route::prefix('stock-transfers')->name('stock-transfers.')->group(function () {
            Route::get('/', [StockTransferController::class, 'index'])->name('index')->middleware('permission:stock-transfer.view');
            Route::get('/create', [StockTransferController::class, 'create'])->name('create')->middleware('permission:stock-transfer.create');
            Route::post('/', [StockTransferController::class, 'store'])->name('store')->middleware('permission:stock-transfer.create');
            Route::get('/{stockTransfer}', [StockTransferController::class, 'show'])->name('show')->middleware('permission:stock-transfer.view');
            Route::get('/{stockTransfer}/edit', [StockTransferController::class, 'edit'])->name('edit')->middleware('permission:stock-transfer.edit');
            Route::put('/{stockTransfer}', [StockTransferController::class, 'update'])->name('update')->middleware('permission:stock-transfer.edit');
            Route::delete('/{stockTransfer}', [StockTransferController::class, 'destroy'])->name('destroy')->middleware('permission:stock-transfer.delete');
            Route::post('/{stockTransfer}/approve', [StockTransferController::class, 'approve'])->name('approve')->middleware('permission:stock-transfer.approve');
            Route::post('/{stockTransfer}/reject', [StockTransferController::class, 'reject'])->name('reject')->middleware('permission:stock-transfer.reject');
            Route::post('/{stockTransfer}/ship', [StockTransferController::class, 'ship'])->name('ship')->middleware('permission:stock-transfer.edit');
            Route::post('/{stockTransfer}/receive', [StockTransferController::class, 'receive'])->name('receive')->middleware('permission:stock-transfer.edit');
            Route::post('/{stockTransfer}/cancel', [StockTransferController::class, 'cancel'])->name('cancel')->middleware('permission:stock-transfer.edit');
            Route::get('/products/stock', [StockTransferController::class, 'getProductStock'])->name('products.stock')->middleware('permission:stock-transfer.view');
        });
        
        // Minimum Stock Alert Routes
        Route::prefix('alerts')->name('alerts.')->group(function () {
            Route::get('/minimum-stock', [MinimumStockAlertController::class, 'index'])->name('minimum-stock')->middleware('permission:inventory.view');
            Route::post('/minimum-stock/update', [MinimumStockAlertController::class, 'updateMinimumStock'])->name('minimum-stock.update')->middleware('permission:inventory.edit');
            Route::post('/minimum-stock/bulk-update', [MinimumStockAlertController::class, 'bulkUpdateMinimumStock'])->name('minimum-stock.bulk-update')->middleware('permission:inventory.edit');
            Route::get('/minimum-stock/export', [MinimumStockAlertController::class, 'export'])->name('minimum-stock.export')->middleware('permission:inventory.view');
            Route::get('/minimum-stock/counts', [MinimumStockAlertController::class, 'getAlertCounts'])->name('minimum-stock.counts')->middleware('permission:inventory.view');
        });
        
        // Stock Movement Routes (akan dibuat nanti)
        // Route::prefix('stock-movements')->name('stock-movements.')->group(function () {
        //     // Movement routes
        // });
    });
});
