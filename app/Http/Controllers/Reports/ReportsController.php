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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * Display reports dashboard
     */
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Get ALL stores for reports (not just user assigned stores)
        $allStores = Store::all();
        
        // Quick stats for dashboard - calculate for ALL stores with growth
        Carbon::setLocale('id');
        $today = Carbon::now('Asia/Jakarta')->startOfDay();
        $todayEnd = Carbon::now('Asia/Jakarta')->endOfDay();
        $thisMonth = Carbon::now('Asia/Jakarta')->startOfMonth();
        $thisMonthEnd = Carbon::now('Asia/Jakarta')->endOfMonth();
        
        // Yesterday for comparison
        $yesterday = Carbon::now('Asia/Jakarta')->subDay()->startOfDay();
        $yesterdayEnd = Carbon::now('Asia/Jakarta')->subDay()->endOfDay();
        
        // Last month for comparison
        $lastMonth = Carbon::now('Asia/Jakarta')->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now('Asia/Jakarta')->subMonth()->endOfMonth();
        
        $todaySales = SalesTransaction::where('transaction_date', '>=', $today)
            ->where('transaction_date', '<=', $todayEnd)
            ->where('status', '!=', 'voided')
            ->sum('total_amount') ?? 0;
            
        $yesterdaySales = SalesTransaction::where('transaction_date', '>=', $yesterday)
            ->where('transaction_date', '<=', $yesterdayEnd)
            ->where('status', '!=', 'voided')
            ->sum('total_amount') ?? 0;
            
        $monthSales = SalesTransaction::where('transaction_date', '>=', $thisMonth)
            ->where('transaction_date', '<=', $thisMonthEnd)
            ->where('status', '!=', 'voided')
            ->sum('total_amount') ?? 0;
            
        $lastMonthSales = SalesTransaction::where('transaction_date', '>=', $lastMonth)
            ->where('transaction_date', '<=', $lastMonthEnd)
            ->where('status', '!=', 'voided')
            ->sum('total_amount') ?? 0;
            
        $todayTransactions = SalesTransaction::where('transaction_date', '>=', $today)
            ->where('transaction_date', '<=', $todayEnd)
            ->where('status', '!=', 'voided')
            ->count();
            
        $yesterdayTransactions = SalesTransaction::where('transaction_date', '>=', $yesterday)
            ->where('transaction_date', '<=', $yesterdayEnd)
            ->where('status', '!=', 'voided')
            ->count();
            
        $lowStockProducts = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->whereRaw('inventories.quantity <= inventories.minimum_stock')
            ->count();
            
        // Calculate growth percentages
        $todaySalesGrowth = $yesterdaySales > 0 ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 : 0;
        $monthSalesGrowth = $lastMonthSales > 0 ? (($monthSales - $lastMonthSales) / $lastMonthSales) * 100 : 0;
        $transactionGrowth = $yesterdayTransactions > 0 ? (($todayTransactions - $yesterdayTransactions) / $yesterdayTransactions) * 100 : 0;

        return Inertia::render('reports/index', [
            'stores' => $allStores,
            'quickStats' => [
                'todaySales' => (float) $todaySales,
                'monthSales' => (float) $monthSales,
                'todayTransactions' => $todayTransactions,
                'lowStockProducts' => $lowStockProducts,
                'todaySalesGrowth' => round($todaySalesGrowth, 1),
                'monthSalesGrowth' => round($monthSalesGrowth, 1),
                'transactionGrowth' => round($transactionGrowth, 1),
                'stockChange' => -2.0 // Mock data for now, can be calculated later
            ]
        ]);
    }

    /**
     * Analytics dashboard
     */
    public function analytics()
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Get ALL stores for reports
        $allStores = Store::all();
        
        // Quick stats for analytics dashboard
        Carbon::setLocale('id');
        $today = Carbon::now('Asia/Jakarta')->startOfDay();
        $todayEnd = Carbon::now('Asia/Jakarta')->endOfDay();
        $thisMonth = Carbon::now('Asia/Jakarta')->startOfMonth();
        $thisMonthEnd = Carbon::now('Asia/Jakarta')->endOfMonth();
        
        $todaySales = SalesTransaction::where('transaction_date', '>=', $today)
            ->where('transaction_date', '<=', $todayEnd)
            ->where('status', '!=', 'voided')
            ->sum('total_amount') ?? 0;
            
        $monthSales = SalesTransaction::where('transaction_date', '>=', $thisMonth)
            ->where('transaction_date', '<=', $thisMonthEnd)
            ->where('status', '!=', 'voided')
            ->sum('total_amount') ?? 0;
            
        $todayTransactions = SalesTransaction::where('transaction_date', '>=', $today)
            ->where('transaction_date', '<=', $todayEnd)
            ->where('status', '!=', 'voided')
            ->count();
            
        $lowStockProducts = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->whereRaw('inventories.quantity <= inventories.minimum_stock')
            ->count();

        return Inertia::render('reports/analytics', [
            'stores' => $allStores,
            'quickStats' => [
                'todaySales' => (float) $todaySales,
                'monthSales' => (float) $monthSales,
                'todayTransactions' => $todayTransactions,
                'lowStockProducts' => $lowStockProducts,
            ]
        ]);
    }

    /**
     * Sales reports
     */
    public function sales(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Get ALL stores for reports
        $allStores = Store::all();
        
        $storeId = $request->get('store_id');
        if ($storeId === 'all') {
            $storeId = null;
        }
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $groupBy = $request->get('group_by', 'day'); // day, week, month
        
        // Use Carbon with proper timezone for date filtering
        Carbon::setLocale('id');
        $startCarbon = Carbon::createFromFormat('Y-m-d', $startDate, 'Asia/Jakarta')->startOfDay();
        $endCarbon = Carbon::createFromFormat('Y-m-d', $endDate, 'Asia/Jakarta')->endOfDay();
        
        // Debug logging - remove in production
        Log::info('Sales Report Filter Debug', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'startCarbon' => $startCarbon->toDateTimeString(),
            'endCarbon' => $endCarbon->toDateTimeString(),
            'timezone' => $startCarbon->timezone->getName(),
            'storeId' => $storeId
        ]);
        
        // Filter transactions using date range that accounts for timezone
        $query = SalesTransaction::with(['store', 'user', 'salesItems.product'])
            ->where('transaction_date', '>=', $startCarbon)
            ->where('transaction_date', '<=', $endCarbon)
            ->where('status', '!=', 'voided'); // Exclude voided transactions
            
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        
        $transactions = $query->orderBy('transaction_date', 'desc')->get();
        
        // Debug logging - check transaction count
        Log::info('Sales Report Transaction Count', [
            'total_transactions_found' => $transactions->count(),
            'sample_transactions' => $transactions->take(3)->map(function($t) {
                return [
                    'id' => $t->id,
                    'transaction_number' => $t->transaction_number,
                    'transaction_date' => $t->transaction_date->format('Y-m-d H:i:s'),
                    'total_amount' => $t->total_amount,
                    'status' => $t->status
                ];
            })
        ]);
        
        // Group data for charts
        $chartData = $this->generateSalesChartData($transactions, $groupBy);
        
        // Summary statistics
        $summary = [
            'totalSales' => $transactions->sum('total_amount'),
            'totalTransactions' => $transactions->count(),
            'averageTransaction' => $transactions->count() > 0 ? $transactions->sum('total_amount') / $transactions->count() : 0,
            'totalItems' => $transactions->sum(function($t) { return $t->salesItems->sum('quantity'); })
        ];
        
        // Top products - for all stores or selected store
        $topProducts = DB::table('sales_items')
            ->join('sales_transactions', 'sales_items.sales_transaction_id', '=', 'sales_transactions.id')
            ->join('products', 'sales_items.product_id', '=', 'products.id')
            ->where('sales_transactions.transaction_date', '>=', $startCarbon)
            ->where('sales_transactions.transaction_date', '<=', $endCarbon)
            ->where('sales_transactions.status', '!=', 'voided');
            
        if ($storeId) {
            $topProducts->where('sales_transactions.store_id', $storeId);
        }
            
        $topProducts = $topProducts->select('products.name', 
                DB::raw('SUM(sales_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_items.total_amount) as total_revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_revenue', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('reports/sales', [
            'stores' => $allStores,
            'transactions' => $transactions,
            'chartData' => $chartData,
            'summary' => $summary,
            'topProducts' => $topProducts,
            'filters' => [
                'store_id' => $request->get('store_id'),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy,
            ]
        ]);
    }

    /**
     * Inventory reports
     */
    public function inventory(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Get ALL stores for reports
        $allStores = Store::all();
        
        $storeId = $request->get('store_id');
        if ($storeId === 'all') {
            $storeId = null;
        }
        $categoryId = $request->get('category_id');
        if ($categoryId === 'all') {
            $categoryId = null;
        }
        $stockStatus = $request->get('stock_status');
        if ($stockStatus === 'all') {
            $stockStatus = null;
        }
        
        // Current stock levels - check ALL stores unless specific store selected
        $query = DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('stores', 'inventories.store_id', '=', 'stores.id');
            
        if ($storeId) {
            $query->where('inventories.store_id', $storeId);
        }
        
        if ($categoryId) {
            $query->where('products.category_id', $categoryId);
        }
        
        if ($stockStatus) {
            switch ($stockStatus) {
                case 'out_of_stock':
                    $query->where('inventories.quantity', 0);
                    break;
                case 'low_stock':
                    $query->whereRaw('inventories.quantity <= inventories.minimum_stock AND inventories.quantity > 0');
                    break;
                case 'normal':
                    $query->whereRaw('inventories.quantity > inventories.minimum_stock');
                    break;
            }
        }
        
        // Get products with their inventory data - include ALL stores
        $products = Product::select('id', 'name', 'sku', 'selling_price', 'category_id')
            ->with(['category', 'inventories.store'])
            ->when($categoryId, function($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->when($request->get('search'), function($q) use ($request) {
                $search = $request->get('search');
                $q->where(function($query) use ($search) {
                    $query->where('name', 'like', '%' . $search . '%')
                          ->orWhere('sku', 'like', '%' . $search . '%');
                });
            })
            ->get()
            ->filter(function($product) use ($stockStatus, $storeId) {
                if ($storeId) {
                    $product->inventories = $product->inventories->where('store_id', $storeId);
                }
                
                if ($stockStatus) {
                    $hasMatchingStatus = $product->inventories->some(function($inventory) use ($stockStatus) {
                        return $inventory->stock_status === $stockStatus;
                    });
                    return $hasMatchingStatus;
                }
                
                return $product->inventories->isNotEmpty();
            })
            ->each(function($product) {
                // Explicitly calculate and append both cost and selling values to each inventory
                $product->inventories->each(function($inventory) {
                    $inventory->stock_value = ($inventory->quantity ?? 0) * ($inventory->average_cost ?? 0);
                    $inventory->potential_revenue = ($inventory->quantity ?? 0) * ($inventory->product->selling_price ?? 0);
                });
            });
            
        // Calculate summary using proper model attributes
        $totalProducts = $products->count();
        $totalStockValue = $products->sum(function($product) {
            return $product->inventories->sum(function($inventory) {
                // Calculate stock value as quantity * average_cost
                return ($inventory->quantity ?? 0) * ($inventory->average_cost ?? 0);
            });
        });
        $totalPotentialRevenue = $products->sum(function($product) {
            return $product->inventories->sum(function($inventory) {
                // Calculate potential revenue as quantity * selling_price
                return ($inventory->quantity ?? 0) * ($inventory->product->selling_price ?? 0);
            });
        });
        $lowStockCount = $products->filter(function($product) {
            return $product->inventories->some(function($inventory) {
                return $inventory->isLowStock();
            });
        })->count();
        $outOfStockCount = $products->filter(function($product) {
            return $product->inventories->some(function($inventory) {
                return $inventory->isOutOfStock();
            });
        })->count();

        $summary = [
            'totalProducts' => $totalProducts,
            'totalStockValue' => $totalStockValue,
            'totalPotentialRevenue' => $totalPotentialRevenue,
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
        ];

        // Recent stock movements (last 50) - from ALL stores
        $stockMovements = DB::table('stock_movements')
            ->join('products', 'stock_movements.product_id', '=', 'products.id')
            ->join('stores', 'stock_movements.store_id', '=', 'stores.id')
            ->select(
                'products.name as product_name',
                'stores.name as store_name',
                'stock_movements.type as movement_type',
                'stock_movements.quantity_change as quantity',
                'stock_movements.quantity_before',
                'stock_movements.quantity_after',
                'stock_movements.reference_type',
                'stock_movements.reference_id',
                'stock_movements.movement_date',
                'stock_movements.created_at'
            )
            ->orderBy('stock_movements.created_at', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('reports/inventory', [
            'stores' => $allStores,
            'categories' => Category::all(),
            'products' => $products,
            'summary' => $summary,
            'stockMovements' => $stockMovements,
            'filters' => [
                'store_id' => $request->get('store_id'),
                'category_id' => $request->get('category_id'),
                'stock_status' => $request->get('stock_status'),
                'search' => $request->get('search'),
            ]
        ]);
    }

    /**
     * Financial reports
     */
    public function financial(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Get ALL stores for reports
        $allStores = Store::all();
        
        $storeId = $request->get('store_id');
        if ($storeId === 'all') {
            $storeId = null;
        }
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        
        // Use Carbon with proper timezone for date filtering
        Carbon::setLocale('id');
        $startCarbon = Carbon::createFromFormat('Y-m-d', $startDate, 'Asia/Jakarta')->startOfDay();
        $endCarbon = Carbon::createFromFormat('Y-m-d', $endDate, 'Asia/Jakarta')->endOfDay();
        
        // Revenue data - from ALL stores unless specific store selected
        $revenueQuery = SalesTransaction::with(['salesItems.product'])
            ->where('transaction_date', '>=', $startCarbon)
            ->where('transaction_date', '<=', $endCarbon)
            ->where('status', '!=', 'voided'); // Exclude voided transactions
            
        if ($storeId) {
            $revenueQuery->where('store_id', $storeId);
        }
        
        $transactions = $revenueQuery->get();
        
        // Calculate financial summary using proper model relationships
        $totalRevenue = $transactions->sum('total_amount');
        $totalCOGS = $transactions->sum(function ($transaction) {
            return $transaction->salesItems->sum(function ($item) {
                // Use purchase_price from Product model
                return $item->quantity * ($item->product->purchase_price ?? 0);
            });
        });
        $grossProfit = $totalRevenue - $totalCOGS;
        $profitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        $summary = [
            'totalRevenue' => $totalRevenue,
            'totalCOGS' => $totalCOGS,
            'grossProfit' => $grossProfit,
            'netProfit' => $grossProfit, // Simplified, no operating expenses
            'profitMargin' => $profitMargin,
            'totalTransactions' => $transactions->count(),
        ];

        // Payment methods summary using transaction total (after discount) for consistency
        $paymentSummary = $transactions
            ->filter(function ($transaction) {
                return $transaction->payments->isNotEmpty();
            })
            ->groupBy(function ($transaction) {
                // Group by the first payment method (assuming single payment method per transaction)
                return $transaction->payments->first()->paymentMethod->name ?? 'Unknown';
            })
            ->map(function ($group, $method) use ($totalRevenue) {
                $total = $group->sum('total_amount'); // Use transaction total instead of payment amount
                return [
                    'method' => $method,
                    'total_amount' => $total,
                    'transaction_count' => $group->count(),
                    'percentage' => $totalRevenue > 0 ? ($total / $totalRevenue) * 100 : 0,
                ];
            })
            ->values();

        // Daily summary using proper model relationships
        $dailySummary = $transactions
            ->groupBy(function ($transaction) {
                return $transaction->transaction_date->format('Y-m-d');
            })
            ->map(function ($group, $date) {
                $revenue = $group->sum('total_amount');
                $cogs = $group->sum(function ($transaction) {
                    return $transaction->salesItems->sum(function ($item) {
                        return $item->quantity * ($item->product->purchase_price ?? 0);
                    });
                });
                return [
                    'date' => $date,
                    'revenue' => $revenue,
                    'cogs' => $cogs,
                    'profit' => $revenue - $cogs,
                    'transactions' => $group->count(),
                ];
            })
            ->values();

        // Discount summary
        $discountSummary = [
            'total_discount_amount' => $transactions->sum('discount_amount'),
            'total_customer_discount' => $transactions->sum('customer_discount_amount'),
            'total_additional_discount' => $transactions->sum('additional_discount_amount'),
            'total_all_discounts' => $transactions->sum(function ($transaction) {
                return ($transaction->discount_amount ?? 0) + 
                       ($transaction->customer_discount_amount ?? 0) + 
                       ($transaction->additional_discount_amount ?? 0);
            }),
            'average_discount_percentage' => $transactions->where('customer_discount_percentage', '>', 0)->avg('customer_discount_percentage') ?? 0,
            'transactions_with_discount' => $transactions->filter(function ($transaction) {
                return ($transaction->discount_amount ?? 0) > 0 || 
                       ($transaction->customer_discount_amount ?? 0) > 0 || 
                       ($transaction->additional_discount_amount ?? 0) > 0;
            })->count(),
        ];

        // Discount breakdown by type
        $discountBreakdown = [
            [
                'type' => 'Diskon Produk',
                'total_amount' => $transactions->sum('discount_amount'),
                'transaction_count' => $transactions->where('discount_amount', '>', 0)->count(),
                'percentage_of_revenue' => $totalRevenue > 0 ? ($transactions->sum('discount_amount') / $totalRevenue) * 100 : 0,
            ],
            [
                'type' => 'Diskon Customer',
                'total_amount' => $transactions->sum('customer_discount_amount'),
                'transaction_count' => $transactions->where('customer_discount_amount', '>', 0)->count(),
                'percentage_of_revenue' => $totalRevenue > 0 ? ($transactions->sum('customer_discount_amount') / $totalRevenue) * 100 : 0,
            ],
            [
                'type' => 'Diskon Tambahan',
                'total_amount' => $transactions->sum('additional_discount_amount'),
                'transaction_count' => $transactions->where('additional_discount_amount', '>', 0)->count(),
                'percentage_of_revenue' => $totalRevenue > 0 ? ($transactions->sum('additional_discount_amount') / $totalRevenue) * 100 : 0,
            ],
        ];

        // Category performance
        $categoryPerformance = $transactions
            ->flatMap(function ($transaction) {
                return $transaction->salesItems;
            })
            ->filter(function ($item) {
                return $item->product && $item->product->category;
            })
            ->groupBy('product.category.name')
            ->map(function ($items, $categoryName) {
                $revenue = $items->sum('total_amount');
                $cogs = $items->sum(function ($item) {
                    return $item->quantity * ($item->product->cost_price ?? 0);
                });
                $profit = $revenue - $cogs;
                
                return [
                    'category_name' => $categoryName,
                    'revenue' => $revenue,
                    'quantity_sold' => $items->sum('quantity'),
                    'profit' => $profit,
                    'profit_margin' => $revenue > 0 ? ($profit / $revenue) * 100 : 0,
                ];
            })
            ->values();

        return Inertia::render('reports/financial', [
            'stores' => $allStores,
            'paymentMethods' => PaymentMethod::all(),
            'summary' => $summary,
            'paymentSummary' => $paymentSummary,
            'dailySummary' => $dailySummary,
            'categoryPerformance' => $categoryPerformance,
            'discountSummary' => $discountSummary,
            'discountBreakdown' => $discountBreakdown,
            'filters' => [
                'store_id' => $request->get('store_id'),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $request->get('group_by', 'day'),
            ]
        ]);
    }

    /**
     * Generate chart data for sales
     */
    private function generateSalesChartData($transactions, $groupBy)
    {
        switch ($groupBy) {
            case 'week':
                return $transactions->groupBy(function($item) {
                    return Carbon::parse($item->transaction_date)->format('Y-W');
                })->map(function($group) {
                    return $group->sum('total_amount');
                });
                
            case 'month':
                return $transactions->groupBy(function($item) {
                    return Carbon::parse($item->transaction_date)->format('Y-m');
                })->map(function($group) {
                    return $group->sum('total_amount');
                });
                
            default: // day
                return $transactions->groupBy(function($item) {
                    return Carbon::parse($item->transaction_date)->format('Y-m-d');
                })->map(function($group) {
                    return $group->sum('total_amount');
                });
        }
    }

    /**
     * Export reports
     */
    public function export(Request $request)
    {
        $type = $request->get('type'); // sales, inventory, financial
        $format = $request->get('format', 'excel'); // excel, pdf, csv
        
        // Implementation for export functionality
        // This would use packages like Laravel Excel or DomPDF
        
        return response()->json(['message' => 'Export functionality to be implemented']);
    }
}
