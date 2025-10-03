<?php

use App\Http\Controllers\POS\CashierController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // POS Routes
    Route::prefix('pos')->name('pos.')->group(function () {
        // Store Selection
        Route::get('/select-store', [CashierController::class, 'selectStore'])->name('select-store')->middleware('permission:pos.view');
        Route::post('/set-store', [CashierController::class, 'setStore'])->name('set-store')->middleware('permission:pos.view');
        Route::post('/reset-store', [CashierController::class, 'resetStore'])->name('reset-store')->middleware('permission:pos.view');
        Route::post('/exit', [CashierController::class, 'exitPOS'])->name('exit')->middleware('permission:pos.view');
        
        // Cashier Interface
        Route::prefix('cashier')->name('cashier.')->group(function () {
            Route::get('/', [CashierController::class, 'index'])->name('index')->middleware('permission:pos.view');
            Route::post('/process', [CashierController::class, 'processTransaction'])->name('process')->middleware('permission:pos.create');
            Route::post('/quick-customer', [CashierController::class, 'quickAddCustomer'])->name('quick-customer')->middleware('permission:pos.create');
            Route::get('/search-product', [CashierController::class, 'searchProduct'])->name('search-product')->middleware('permission:pos.view');
            Route::get('/search-customers', [CashierController::class, 'searchCustomers'])->name('search-customers')->middleware('permission:pos.view');
            Route::get('/transaction-history', [CashierController::class, 'transactionHistory'])->name('transaction-history')->middleware('permission:pos.view');
            Route::get('/transaction/{id}', [CashierController::class, 'transactionDetail'])->name('transaction-detail')->middleware('permission:pos.view');
        });
    });
});
