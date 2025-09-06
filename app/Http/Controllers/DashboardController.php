<?php

namespace App\Http\Controllers;

use App\Models\SalesTransaction;
use App\Models\Customer;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get today's date
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth();
        $lastMonthStart = $lastMonth->copy()->startOfMonth();
        $lastMonthEnd = $lastMonth->copy()->endOfMonth();
        
        // Today's statistics
        $todayTransactions = SalesTransaction::whereDate('created_at', $today)
            ->where('status', '!=', 'voided')
            ->count();
            
        $todaySales = SalesTransaction::whereDate('created_at', $today)
            ->where('status', '!=', 'voided')
            ->sum('total_amount');
        
        // Monthly statistics  
        $monthlyRevenue = SalesTransaction::whereBetween('created_at', [$startOfMonth, Carbon::now()])
            ->where('status', '!=', 'voided')
            ->sum('total_amount');
            
        $lastMonthRevenue = SalesTransaction::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->where('status', '!=', 'voided')
            ->sum('total_amount');
            
        // Calculate growth percentage
        $monthlyGrowth = 0;
        if ($lastMonthRevenue > 0) {
            $monthlyGrowth = (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        }
        
        // Product and inventory statistics
        $totalProducts = Product::count();
        
        // Get products with low stock using a more efficient query
        $lowStockProducts = DB::table('products')
            ->join('inventories', 'products.id', '=', 'inventories.product_id')
            ->select('products.id')
            ->whereRaw('inventories.quantity <= inventories.minimum_stock')
            ->distinct()
            ->count();
        
        // Customer statistics
        $totalCustomers = Customer::count();
        $newCustomersThisMonth = Customer::whereBetween('created_at', [$startOfMonth, Carbon::now()])->count();
        
        // Yesterday comparison for today's stats
        $yesterday = Carbon::yesterday();
        $yesterdayTransactions = SalesTransaction::whereDate('created_at', $yesterday)
            ->where('status', '!=', 'voided')
            ->count();
            
        $yesterdaySales = SalesTransaction::whereDate('created_at', $yesterday)
            ->where('status', '!=', 'voided')
            ->sum('total_amount');
        
        // Weekly sales data for chart (last 7 days)
        $weeklyData = [];
        $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayName = $days[$date->dayOfWeek === 0 ? 6 : $date->dayOfWeek - 1]; // Convert Sunday=0 to Sunday=6
            
            $sales = SalesTransaction::whereDate('created_at', $date)
                ->where('status', '!=', 'voided')
                ->sum('total_amount');
                
            $transactions = SalesTransaction::whereDate('created_at', $date)
                ->where('status', '!=', 'voided')
                ->count();
                
            $weeklyData[] = [
                'name' => $dayName,
                'sales' => (float) $sales,
                'transactions' => $transactions,
                'date' => $date->format('Y-m-d')
            ];
        }
        
        // Monthly revenue data for the last 6 months
        $monthlyData = [];
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $monthName = $monthNames[$monthStart->month - 1];
            
            $revenue = SalesTransaction::whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', '!=', 'voided')
                ->sum('total_amount');
                
            // Set a target (you can make this dynamic later)
            $target = $revenue * 1.2; // 20% higher than actual for demo
            
            $monthlyData[] = [
                'month' => $monthName,
                'revenue' => (float) $revenue,
                'target' => (float) $target
            ];
        }
        
        // Top selling products
        $topProducts = DB::table('sales_items')
            ->join('products', 'sales_items.product_id', '=', 'products.id')
            ->join('sales_transactions', 'sales_items.sales_transaction_id', '=', 'sales_transactions.id')
            ->select('products.name', DB::raw('SUM(sales_items.quantity) as total_sold'))
            ->where('sales_transactions.created_at', '>=', Carbon::now()->subWeek())
            ->where('sales_transactions.status', '!=', 'voided')
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'value' => (int) $item->total_sold
                ];
            })->toArray();
        
        // Latest transactions
        $latestTransactions = SalesTransaction::with(['customer', 'items.product'])
            ->where('status', '!=', 'voided')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_number' => $transaction->transaction_number ?? 'TRX' . str_pad($transaction->id, 6, '0', STR_PAD_LEFT),
                    'customer_name' => $transaction->customer ? $transaction->customer->name : 'Walk-in Customer',
                    'customer_code' => $transaction->customer ? $transaction->customer->customer_code : null,
                    'total_amount' => (float) $transaction->total_amount,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'formatted_date' => $transaction->created_at->format('d/m/Y')
                ];
            })->toArray();

        // Weekly revenue calculation
        $startOfWeek = Carbon::now()->startOfWeek();
        $weeklyRevenue = SalesTransaction::whereBetween('created_at', [$startOfWeek, Carbon::now()])
            ->where('status', '!=', 'voided')
            ->sum('total_amount');

        $stats = [
            'todayTransactions' => $todayTransactions,
            'todaySales' => $todaySales,
            'monthSales' => $monthlyRevenue, // Keep for backward compatibility
            'monthlyRevenue' => $monthlyRevenue,
            'weeklyRevenue' => $weeklyRevenue,
            'monthlyGrowth' => round($monthlyGrowth, 1),
            'lowStockProducts' => $lowStockProducts,
            'totalCustomers' => $totalCustomers,
            'totalProducts' => $totalProducts,
            'newCustomersThisMonth' => $newCustomersThisMonth,
            'yesterdayComparison' => [
                'transactions' => $yesterdayTransactions,
                'sales' => $yesterdaySales,
            ],
        ];
        
        return Inertia::render('dashboard', [
            'stats' => $stats,
            'chartData' => [
                'weeklyData' => $weeklyData,
                'monthlyData' => $monthlyData,
                'topProducts' => $topProducts
            ],
            'latestTransactions' => $latestTransactions,
            'user' => request()->user()->load('role.permissions')
        ]);
    }
}
