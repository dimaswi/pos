<?php

use App\Http\Controllers\Sales\SalesTransactionController;
use App\Http\Controllers\Sales\PaymentMethodController;
use App\Http\Controllers\Sales\DiscountController;
use App\Http\Controllers\Sales\ReturnController;
use App\Http\Controllers\Sales\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Sales Management Routes
    Route::prefix('sales')->name('sales.')->group(function () {
        
        // Sales Transactions Routes
        Route::prefix('transactions')->name('transactions.')->group(function () {
            Route::get('/', [SalesTransactionController::class, 'index'])->name('index')->middleware('permission:sales.view');
            Route::get('/create', [SalesTransactionController::class, 'create'])->name('create')->middleware('permission:sales.create');
            Route::post('/', [SalesTransactionController::class, 'store'])->name('store')->middleware('permission:sales.create');
            Route::get('/{salesTransaction}', [SalesTransactionController::class, 'show'])->name('show')->middleware('permission:sales.view');
            Route::get('/{salesTransaction}/edit', [SalesTransactionController::class, 'edit'])->name('edit')->middleware('permission:sales.edit');
            Route::put('/{salesTransaction}', [SalesTransactionController::class, 'update'])->name('update')->middleware('permission:sales.edit');
            Route::delete('/{salesTransaction}', [SalesTransactionController::class, 'destroy'])->name('destroy')->middleware('permission:sales.delete');
            Route::get('/{salesTransaction}/receipt', [SalesTransactionController::class, 'receipt'])->name('receipt')->middleware('permission:sales.view');
            Route::post('/{salesTransaction}/void', [SalesTransactionController::class, 'void'])->name('void')->middleware('permission:sales.void');
        });
        
        // Payment Methods Routes
        Route::prefix('payment-methods')->name('payment-methods.')->group(function () {
            Route::get('/', [PaymentMethodController::class, 'index'])->name('index')->middleware('permission:payment-method.view');
            Route::get('/create', [PaymentMethodController::class, 'create'])->name('create')->middleware('permission:payment-method.create');
            Route::post('/', [PaymentMethodController::class, 'store'])->name('store')->middleware('permission:payment-method.create');
            Route::get('/{paymentMethod}', [PaymentMethodController::class, 'show'])->name('show')->middleware('permission:payment-method.view');
            Route::get('/{paymentMethod}/edit', [PaymentMethodController::class, 'edit'])->name('edit')->middleware('permission:payment-method.edit');
            Route::put('/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('update')->middleware('permission:payment-method.edit');
            Route::delete('/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('destroy')->middleware('permission:payment-method.delete');
            Route::post('/{paymentMethod}/toggle-status', [PaymentMethodController::class, 'toggleStatus'])->name('toggle-status')->middleware('permission:payment-method.edit');
        });
        
        // Discounts Routes
        Route::prefix('discounts')->name('discounts.')->group(function () {
            Route::get('/', [DiscountController::class, 'index'])->name('index')->middleware('permission:discount.view');
            Route::get('/create', [DiscountController::class, 'create'])->name('create')->middleware('permission:discount.create');
            Route::post('/', [DiscountController::class, 'store'])->name('store')->middleware('permission:discount.create');
            Route::get('/{discount}', [DiscountController::class, 'show'])->name('show')->middleware('permission:discount.view');
            Route::get('/{discount}/edit', [DiscountController::class, 'edit'])->name('edit')->middleware('permission:discount.edit');
            Route::put('/{discount}', [DiscountController::class, 'update'])->name('update')->middleware('permission:discount.edit');
            Route::delete('/{discount}', [DiscountController::class, 'destroy'])->name('destroy')->middleware('permission:discount.delete');
            Route::post('/{discount}/toggle-status', [DiscountController::class, 'toggleStatus'])->name('toggle-status')->middleware('permission:discount.edit');
            Route::post('/validate-code', [DiscountController::class, 'validateCode'])->name('validate-code')->middleware('permission:discount.view');
        });
        
        // Returns Routes
        Route::prefix('returns')->name('returns.')->group(function () {
            Route::get('/', [ReturnController::class, 'index'])->name('index')->middleware('permission:sales.view');
            Route::get('/create', [ReturnController::class, 'create'])->name('create')->middleware('permission:sales.create');
            Route::get('/check-existing', [ReturnController::class, 'checkExisting'])->name('check-existing')->middleware('permission:sales.view');
            Route::post('/', [ReturnController::class, 'store'])->name('store')->middleware('permission:sales.create');
            Route::get('/{return}', [ReturnController::class, 'show'])->name('show')->middleware('permission:sales.view');
            Route::get('/{return}/edit', [ReturnController::class, 'edit'])->name('edit')->middleware('permission:sales.edit');
            Route::put('/{return}', [ReturnController::class, 'update'])->name('update')->middleware('permission:sales.edit');
            Route::delete('/{return}', [ReturnController::class, 'destroy'])->name('destroy')->middleware('permission:sales.delete');
            Route::post('/{return}/approve', [ReturnController::class, 'approve'])->name('approve')->middleware('permission:return.approve');
            Route::post('/{return}/reject', [ReturnController::class, 'reject'])->name('reject')->middleware('permission:return.reject');
            Route::post('/get-transaction', [ReturnController::class, 'getTransaction'])->name('get-transaction')->middleware('permission:sales.view');
        });
        
    });
});
