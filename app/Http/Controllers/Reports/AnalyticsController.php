<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalesTransaction;
use App\Models\SalesPayment;
use App\Models\StockMovement;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\SalesItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get dashboard analytics data
     */
    public function dashboard(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Get date range
        $period = $request->get('period', '7days'); // today, 7days, 30days, 90days
        $storeId = $request->get('store_id');
        
        Carbon::setLocale('id');
        $endDate = Carbon::now('Asia/Jakarta');
        
        switch ($period) {
            case 'today':
                $startDate = $endDate->copy()->startOfDay();
                $endDate = $endDate->copy()->endOfDay();
                break;
            case '30days':
                $startDate = $endDate->copy()->subDays(30)->startOfDay();
                $endDate = $endDate->copy()->endOfDay();
                break;
            case '90days':
                $startDate = $endDate->copy()->subDays(90)->startOfDay();
                $endDate = $endDate->copy()->endOfDay();
                break;
            default: // 7days
                $startDate = $endDate->copy()->subDays(7)->startOfDay();
                $endDate = $endDate->copy()->endOfDay();
                break;
        }
        
        // Base query
        $query = SalesTransaction::where('transaction_date', '>=', $startDate)
            ->where('transaction_date', '<=', $endDate)
            ->whereIn('status', ['completed', 'pending', 'processing']);
            
        if ($storeId && $storeId !== 'all') {
            $query->where('store_id', $storeId);
        }
        
        $transactions = $query->with(['store', 'user', 'salesItems.product'])->get();
        
        // Calculate metrics with proper growth comparison
        $totalRevenue = $transactions->sum('total_amount');
        $totalTransactions = $transactions->count();
        $averageTransaction = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;
        $totalItems = $transactions->sum(function($t) { 
            return $t->salesItems ? $t->salesItems->sum('quantity') : 0; 
        });

        // Calculate growth compared to previous period - FIXED LOGIC
        switch ($period) {
            case 'today':
                // Compare today with yesterday
                $previousPeriodStart = Carbon::now('Asia/Jakarta')->subDay()->startOfDay();
                $previousPeriodEnd = Carbon::now('Asia/Jakarta')->subDay()->endOfDay();
                break;
            case '30days':
                // Compare last 30 days with previous 30 days (day 31-60)
                $previousPeriodStart = $endDate->copy()->subDays(60)->startOfDay();
                $previousPeriodEnd = $endDate->copy()->subDays(31)->endOfDay();
                break;
            case '90days':
                // Compare last 90 days with previous 90 days (day 91-180)
                $previousPeriodStart = $endDate->copy()->subDays(180)->startOfDay();
                $previousPeriodEnd = $endDate->copy()->subDays(91)->endOfDay();
                break;
            default: // 7days
                // Compare last 7 days with previous 7 days (day 8-14)
                $previousPeriodStart = $endDate->copy()->subDays(14)->startOfDay();
                $previousPeriodEnd = $endDate->copy()->subDays(8)->endOfDay();
                break;
        }
        
        // Calculate growth compared to previous period
        $previousQuery = SalesTransaction::where('transaction_date', '>=', $previousPeriodStart)
            ->where('transaction_date', '<=', $previousPeriodEnd)
            ->whereIn('status', ['completed', 'pending', 'processing']);
            
        if ($storeId && $storeId !== 'all') {
            $previousQuery->where('store_id', $storeId);
        }
        
        $previousTransactions = $previousQuery->get();
        $previousRevenue = $previousTransactions->sum('total_amount');
        $previousTransactionCount = $previousTransactions->count();
        $previousItems = $previousTransactions->sum(function($t) { 
            return $t->salesItems ? $t->salesItems->sum('quantity') : 0; 
        });
        
        // Calculate growth percentages - REAL CALCULATION
        if ($previousRevenue > 0) {
            $revenueGrowth = (($totalRevenue - $previousRevenue) / $previousRevenue) * 100;
        } elseif ($totalRevenue > 0 && $previousRevenue == 0) {
            // Only show 100% if we actually have current data and no previous data
            $revenueGrowth = 100;
        } else {
            $revenueGrowth = 0;
        }
        
        if ($previousTransactionCount > 0) {
            $transactionGrowth = (($totalTransactions - $previousTransactionCount) / $previousTransactionCount) * 100;
        } elseif ($totalTransactions > 0 && $previousTransactionCount == 0) {
            $transactionGrowth = 100;
        } else {
            $transactionGrowth = 0;
        }
        
        if ($previousItems > 0) {
            $itemsGrowth = (($totalItems - $previousItems) / $previousItems) * 100;
        } elseif ($totalItems > 0 && $previousItems == 0) {
            $itemsGrowth = 100;
        } else {
            $itemsGrowth = 0;
        }
        
        // Daily breakdown - REAL DATA FROM DATABASE
        $dailyData = [];
        if ($period === 'today') {
            // For today, create hourly breakdown from real database data
            for ($hour = 0; $hour < 24; $hour++) {
                $hourStart = $startDate->copy()->hour($hour)->minute(0)->second(0);
                $hourEnd = $hourStart->copy()->hour($hour)->minute(59)->second(59);
                
                // Query real data from database for this hour
                $hourQuery = SalesTransaction::where('transaction_date', '>=', $hourStart)
                    ->where('transaction_date', '<=', $hourEnd)
                    ->whereIn('status', ['completed', 'pending', 'processing']);
                    
                if ($storeId && $storeId !== 'all') {
                    $hourQuery->where('store_id', $storeId);
                }
                
                $hourTransactions = $hourQuery->get();
                
                $dailyData[] = [
                    'date' => $hourStart->format('H:i'),
                    'revenue' => (int) $hourTransactions->sum('total_amount'),
                    'transactions' => $hourTransactions->count(),
                    'items' => $hourTransactions->sum(function($t) { 
                        return $t->salesItems ? $t->salesItems->sum('quantity') : 0; 
                    })
                ];
            }
        } else {
            // For multi-day periods, query real data day by day
            $periodDays = $startDate->diffInDays($endDate) + 1;
            
            for ($i = 0; $i < $periodDays; $i++) {
                $currentDate = $startDate->copy()->addDays($i);
                $dayStart = $currentDate->copy()->startOfDay();
                $dayEnd = $currentDate->copy()->endOfDay();
                
                // Query real data from database for this day
                $dayQuery = SalesTransaction::where('transaction_date', '>=', $dayStart)
                    ->where('transaction_date', '<=', $dayEnd)
                    ->whereIn('status', ['completed', 'pending', 'processing']);
                    
                if ($storeId && $storeId !== 'all') {
                    $dayQuery->where('store_id', $storeId);
                }
                
                $dayTransactions = $dayQuery->get();
                
                $dayRevenue = $dayTransactions->sum('total_amount');
                $dayTransactionCount = $dayTransactions->count();
                
                $dailyData[] = [
                    'date' => $currentDate->format('Y-m-d'),
                    'revenue' => (int) $dayRevenue,
                    'transactions' => $dayTransactionCount,
                    'items' => $dayTransactions->sum(function($t) { 
                        return $t->salesItems ? $t->salesItems->sum('quantity') : 0; 
                    })
                ];
            }
        }
        
        // Top products
        $topProducts = SalesItem::whereHas('salesTransaction', function($q) use ($startDate, $endDate, $storeId) {
            $q->where('transaction_date', '>=', $startDate)
              ->where('transaction_date', '<=', $endDate)
              ->whereIn('status', ['completed', 'pending', 'processing']);
            if ($storeId && $storeId !== 'all') {
                $q->where('store_id', $storeId);
            }
        })
        ->with('product')
        ->select('product_id', 
            DB::raw('SUM(quantity) as total_quantity'),
            DB::raw('SUM(total_amount) as total_revenue'))
        ->groupBy('product_id')
        ->orderBy('total_revenue', 'desc')
        ->limit(10)
        ->get();
        
        // Store performance
        $storePerformance = $transactions->groupBy('store_id')->map(function($group, $storeId) {
            $store = $group->first()->store;
            return [
                'store_id' => $storeId,
                'store_name' => $store->name,
                'revenue' => $group->sum('total_amount'),
                'transactions' => $group->count(),
                'average_transaction' => $group->count() > 0 ? $group->sum('total_amount') / $group->count() : 0
            ];
        })->values();
        
        // Payment methods breakdown - REAL DATA FROM DATABASE
        $paymentBreakdown = collect();
        
        // Query real payment data from database
        $payments = SalesPayment::whereHas('salesTransaction', function($q) use ($startDate, $endDate, $storeId) {
            $q->where('transaction_date', '>=', $startDate)
              ->where('transaction_date', '<=', $endDate)
              ->whereIn('status', ['completed', 'pending', 'processing']);
            if ($storeId && $storeId !== 'all') {
                $q->where('store_id', $storeId);
            }
        })->with(['paymentMethod', 'salesTransaction'])->get();
        
        if ($payments->count() > 0) {
            $paymentBreakdown = $payments->groupBy('payment_method_id')->map(function($group) use ($totalRevenue) {
                $paymentMethod = $group->first()->paymentMethod;
                $total = $group->sum('amount');
                
                return [
                    'method' => $paymentMethod->name ?? 'Unknown',
                    'total_amount' => (float) $total,
                    'transaction_count' => $group->count(),
                    'percentage' => $totalRevenue > 0 ? ($total / $totalRevenue) * 100 : 0
                ];
            })->values();
        } else {
            // If no payments found, use transaction total as cash (fallback)
            if ($totalRevenue > 0) {
                $paymentBreakdown = collect([
                    [
                        'method' => 'Cash',
                        'total_amount' => (int) $totalRevenue,
                        'transaction_count' => $totalTransactions,
                        'percentage' => 100
                    ]
                ]);
            }
        }
        
        return response()->json([
            'success' => true,
            'summary' => [
                'total_revenue' => (int) $totalRevenue,
                'total_transactions' => (int) $totalTransactions,
                'average_transaction' => (int) $averageTransaction,
                'total_items' => (int) $totalItems,
                'revenue_growth' => (float) round($revenueGrowth, 1),
                'transaction_growth' => (float) round($transactionGrowth, 1),
                'items_growth' => (float) round($itemsGrowth, 1)
            ],
            'daily_data' => array_map(function($day) {
                return [
                    'date' => $day['date'],
                    'revenue' => (int) $day['revenue'],
                    'transactions' => (int) $day['transactions'],
                    'items' => (int) $day['items']
                ];
            }, $dailyData),
            'top_products' => $topProducts->map(function($item) {
                return [
                    'product_id' => $item->product_id,
                    'product' => [
                        'id' => $item->product->id ?? null,
                        'name' => $item->product->name ?? 'Unknown Product',
                        'sku' => $item->product->sku ?? null
                    ],
                    'total_quantity' => (int) $item->total_quantity,
                    'total_revenue' => (int) $item->total_revenue
                ];
            }),
            'store_performance' => $storePerformance->map(function($store) {
                return [
                    'store_id' => $store['store_id'],
                    'store_name' => $store['store_name'],
                    'revenue' => (int) $store['revenue'],
                    'transactions' => (int) $store['transactions'],
                    'average_transaction' => (int) $store['average_transaction']
                ];
            }),
            'payment_breakdown' => $paymentBreakdown->map(function($payment) {
                return [
                    'method' => $payment['method'],
                    'total_amount' => (int) $payment['total_amount'],
                    'transaction_count' => (int) $payment['transaction_count'],
                    'percentage' => (float) round($payment['percentage'], 1)
                ];
            }),
            'period' => $period,
            'date_range' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d')
            ]
        ]);
    }
    
    /**
     * Get real-time metrics
     */
    public function realtime(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $storeId = $request->get('store_id');
        
        Carbon::setLocale('id');
        $today = Carbon::now('Asia/Jakarta')->startOfDay();
        $todayEnd = Carbon::now('Asia/Jakarta')->endOfDay();
        
        // Today's sales
        $query = SalesTransaction::where('transaction_date', '>=', $today)
            ->where('transaction_date', '<=', $todayEnd)
            ->whereIn('status', ['completed', 'pending', 'processing']);
            
        if ($storeId && $storeId !== 'all') {
            $query->where('store_id', $storeId);
        }
        
        $todayTransactions = $query->get();
        
        // Hourly breakdown for today
        $hourlyData = $todayTransactions->groupBy(function($t) {
            return $t->transaction_date->format('H');
        })->map(function($group, $hour) {
            return [
                'hour' => intval($hour),
                'revenue' => (int) $group->sum('total_amount'),
                'transactions' => $group->count()
            ];
        })->values();
        
        // Current metrics
        $currentRevenue = $todayTransactions->sum('total_amount');
        $currentTransactions = $todayTransactions->count();
        
        // Compare with yesterday
        $yesterday = Carbon::now('Asia/Jakarta')->subDay()->startOfDay();
        $yesterdayEnd = Carbon::now('Asia/Jakarta')->subDay()->endOfDay();
        
        $yesterdayQuery = SalesTransaction::where('transaction_date', '>=', $yesterday)
            ->where('transaction_date', '<=', $yesterdayEnd)
            ->whereIn('status', ['completed', 'pending', 'processing']);
            
        if ($storeId && $storeId !== 'all') {
            $yesterdayQuery->where('store_id', $storeId);
        }
        
        $yesterdayRevenue = $yesterdayQuery->sum('total_amount');
        $yesterdayTransactions = $yesterdayQuery->count();
        
        // Calculate growth
        $revenueGrowth = $yesterdayRevenue > 0 ? 
            (($currentRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100 : 0;
        $transactionGrowth = $yesterdayTransactions > 0 ? 
            (($currentTransactions - $yesterdayTransactions) / $yesterdayTransactions) * 100 : 0;
        
        return response()->json([
            'current' => [
                'revenue' => (int) $currentRevenue,
                'transactions' => $currentTransactions,
                'average_transaction' => $currentTransactions > 0 ? (int) ($currentRevenue / $currentTransactions) : 0
            ],
            'growth' => [
                'revenue' => (float) round($revenueGrowth, 1),
                'transactions' => (float) round($transactionGrowth, 1)
            ],
            'hourly_data' => $hourlyData,
            'last_update' => Carbon::now('Asia/Jakarta')->toISOString()
        ]);
    }
    
    /**
     * Export analytics data (simplified version)
     */
    public function export(Request $request)
    {
        $type = $request->get('type'); // dashboard, sales, inventory, financial
        $format = $request->get('format', 'json'); // json, csv
        $period = $request->get('period', '30days');
        $storeId = $request->get('store_id');
        
        try {
            // For now, return JSON data
            // TODO: Implement Excel/CSV export with Laravel Excel package
            
            switch ($type) {
                case 'sales':
                    $data = $this->dashboard($request);
                    break;
                case 'inventory':
                    $data = $this->inventoryInsights($request);
                    break;
                case 'financial':
                    $data = $this->dashboard($request);
                    break;
                default:
                    return response()->json(['error' => 'Invalid export type'], 400);
            }
            
            if ($format === 'csv') {
                // TODO: Convert to CSV format
                return response()->json(['message' => 'CSV export will be implemented later']);
            }
            
            return $data;
            
        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed'], 500);
        }
    }
    
    /**
     * Get inventory insights
     */
    public function inventoryInsights(Request $request)
    {
        $storeId = $request->get('store_id');
        
        // Low stock alerts
        $lowStockQuery = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->join('stores', 'inventories.store_id', '=', 'stores.id')
            ->whereRaw('inventories.quantity <= inventories.minimum_stock');
            
        if ($storeId && $storeId !== 'all') {
            $lowStockQuery->where('inventories.store_id', $storeId);
        }
        
        $lowStockProducts = $lowStockQuery->select(
            'products.name as product_name',
            'products.sku',
            'stores.name as store_name',
            'inventories.quantity',
            'inventories.minimum_stock'
        )->get();
        
        // Stock value by category
        $stockValueByCategory = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.name as category_name',
                DB::raw('SUM(inventories.quantity * products.purchase_price) as stock_value'),
                DB::raw('SUM(inventories.quantity) as total_quantity')
            )
            ->when($storeId && $storeId !== 'all', function($q) use ($storeId) {
                $q->where('inventories.store_id', $storeId);
            })
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('stock_value', 'desc')
            ->get();
        
        // Recent stock movements
        $recentMovements = StockMovement::with(['product', 'store'])
            ->when($storeId && $storeId !== 'all', function($q) use ($storeId) {
                $q->where('store_id', $storeId);
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'low_stock_products' => $lowStockProducts,
                'stock_value_by_category' => $stockValueByCategory,
                'recent_movements' => $recentMovements
            ]
        ]);
    }
}
