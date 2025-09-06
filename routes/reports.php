<?php

use App\Http\Controllers\Reports\ReportsController;
use App\Http\Controllers\Reports\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Reports Routes
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportsController::class, 'index'])->name('index')->middleware('permission:reports.view');
        Route::get('/analytics', [ReportsController::class, 'analytics'])->name('analytics')->middleware('permission:reports.view');
        Route::get('/sales', [ReportsController::class, 'sales'])->name('sales')->middleware('permission:reports.view');
        Route::get('/inventory', [ReportsController::class, 'inventory'])->name('inventory')->middleware('permission:reports.view');
        Route::get('/financial', [ReportsController::class, 'financial'])->name('financial')->middleware('permission:reports.view');
        Route::post('/export', [ReportsController::class, 'export'])->name('export')->middleware('permission:reports.export');
    });
    
    // Analytics API Routes
    Route::prefix('api/analytics')->name('analytics.')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard'])->name('dashboard')->middleware('permission:reports.view');
        Route::get('/realtime', [AnalyticsController::class, 'realtime'])->name('realtime')->middleware('permission:reports.view');
        Route::get('/inventory-insights', [AnalyticsController::class, 'inventoryInsights'])->name('inventory-insights')->middleware('permission:reports.view');
        Route::post('/export', [AnalyticsController::class, 'export'])->name('export')->middleware('permission:reports.export');
    });
});
