<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Health check route for Docker monitoring
Route::get('/health', function () {
    try {
        // Check database connection
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        
        // Check cache connection
        \Illuminate\Support\Facades\Cache::get('health_check');
        
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'services' => [
                'database' => 'ok',
                'cache' => 'ok',
                'application' => 'ok'
            ]
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'timestamp' => now()->toISOString(),
            'error' => $e->getMessage()
        ], 500);
    }
})->name('health');

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard')->middleware('permission:dashboard.view');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/master.php';
require __DIR__.'/master-data.php';
require __DIR__.'/inventory.php';
require __DIR__.'/sales.php';
require __DIR__.'/pos.php';
require __DIR__.'/reports.php';
require __DIR__.'/web-settings.php';
