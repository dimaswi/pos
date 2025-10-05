import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ShoppingCart, Calculator, Package, Users, BarChart3, Settings, FileText, CreditCard, TrendingUp, Store, AlertTriangle, DollarSign, Activity, Plus, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import PermissionGate from '@/components/permission-gate';
import { usePermission } from '@/hooks/use-permission';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';

interface DashboardStats {
    todayTransactions: number;
    todaySales: number;
    monthSales: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    monthlyGrowth: number;
    lowStockProducts: number;
    totalCustomers: number;
    totalProducts: number;
    newCustomersThisMonth: number;
    yesterdayComparison: {
        transactions: number;
        sales: number;
    };
}

interface ChartData {
    weeklyData: Array<{
        name: string;
        sales: number;
        transactions: number;
        date: string;
    }>;
    monthlyData: Array<{
        month: string;
        revenue: number;
        target: number;
    }>;
    topProducts: Array<{
        name: string;
        value: number;
    }>;
}

interface Transaction {
    id: number;
    transaction_number: string;
    customer_name: string;
    customer_code: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    formatted_date: string;
}

interface Props {
    stats: DashboardStats;
    chartData: ChartData;
    latestTransactions: Transaction[];
    user: {
        id: number;
        name: string;
        email: string;
        role: {
            name: string;
            permissions: Array<{
                name: string;
            }>;
        };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ stats, chartData, latestTransactions, user }: Props) {
    const { hasPermission } = usePermission();
    
    // State for date filters - separate for each chart
    const [activityDateFilter, setActivityDateFilter] = useState('7days');
    const [revenueDateFilter, setRevenueDateFilter] = useState('7days');
    const [targetDateFilter, setTargetDateFilter] = useState('6months');
    
    // Custom date states for each chart
    const [activityCustomStartDate, setActivityCustomStartDate] = useState('');
    const [activityCustomEndDate, setActivityCustomEndDate] = useState('');
    const [revenueCustomStartDate, setRevenueCustomStartDate] = useState('');
    const [revenueCustomEndDate, setRevenueCustomEndDate] = useState('');
    const [targetCustomStartDate, setTargetCustomStartDate] = useState('');
    const [targetCustomEndDate, setTargetCustomEndDate] = useState('');
    
    // Filter options
    const filterOptions = [
        { value: '7days', label: '7 Hari Terakhir' },
        { value: '14days', label: '14 Hari Terakhir' },
        { value: '30days', label: '30 Hari Terakhir' },
        { value: 'custom', label: 'Custom Range' }
    ];

    // Function to filter data based on selected date range
    const getFilteredData = (filterType: string, customStart?: string, customEnd?: string) => {
        console.log('getFilteredData called with:', { filterType, customStart, customEnd });
        console.log('chartData.weeklyData:', chartData?.weeklyData);
        
        // Generate sample data based on filter type for better visualization
        const generateSampleData = (days: number, startDate?: Date, endDate?: Date) => {
            const data = [];
            const baseData = [
                { name: 'Sen', baseSales: 2400000, baseTransactions: 12 },
                { name: 'Sel', baseSales: 1398000, baseTransactions: 8 },
                { name: 'Rab', baseSales: 9800000, baseTransactions: 22 },
                { name: 'Kam', baseSales: 3908000, baseTransactions: 15 },
                { name: 'Jum', baseSales: 4800000, baseTransactions: 18 },
                { name: 'Sab', baseSales: 3800000, baseTransactions: 16 },
                { name: 'Min', baseSales: 4300000, baseTransactions: 14 },
            ];

            // Use provided date range or default to current date backwards
            let currentDate = endDate ? new Date(endDate) : new Date();
            const targetStartDate = startDate ? new Date(startDate) : new Date(currentDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

            // Generate data from start to end date
            const tempData = [];
            let iterDate = new Date(targetStartDate);
            
            while (iterDate <= currentDate) {
                const dayOfWeek = iterDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-6 where 0 = Monday
                const weekNumber = Math.floor((iterDate.getTime() - targetStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                const randomMultiplier = 0.7 + Math.random() * 0.6;
                const base = baseData[dayIndex];
                
                const displayName = `${iterDate.getDate()}/${iterDate.getMonth() + 1}`;
                
                tempData.push({
                    name: displayName,
                    sales: Math.floor(base.baseSales * randomMultiplier * (weekNumber * 0.8 + 0.4)),
                    transactions: Math.floor(base.baseTransactions * randomMultiplier * (weekNumber * 0.8 + 0.4)),
                    date: iterDate.toISOString().split('T')[0]
                });
                
                // Move to next day
                iterDate.setDate(iterDate.getDate() + 1);
            }
            
            return tempData;
        };

        // Use real data from database - prioritize authentic business data
        if (chartData?.weeklyData && chartData.weeklyData.length > 0) {
            console.log('Using real database data');
            
            // Filter real data based on date range and convert day names to dates
            const now = new Date();
            let startDate = new Date();
            
            switch (filterType) {
                case '7days':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '14days':
                    startDate.setDate(now.getDate() - 14);
                    break;
                case '30days':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case 'custom':
                    if (customStart && customEnd) {
                        startDate = new Date(customStart);
                    }
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
            }
            
            let filteredData = chartData.weeklyData.filter(item => {
                const itemDate = new Date(item.date);
                if (filterType === 'custom' && customStart && customEnd) {
                    const endDate = new Date(customEnd);
                    return itemDate >= startDate && itemDate <= endDate;
                }
                return itemDate >= startDate;
            });

            console.log('Real database data filtered:', filteredData);
            console.log('Filter criteria - startDate:', startDate, 'filterType:', filterType);

            // Convert data to use date format instead of day names
            filteredData = filteredData.map(item => {
                const itemDate = new Date(item.date);
                return {
                    ...item,
                    name: `${itemDate.getDate()}/${itemDate.getMonth() + 1}`
                };
            });

            return filteredData;
        }

        // Only use sample data as fallback if no real data available
        console.log('No database data available, using sample data as fallback');
        switch (filterType) {
            case '7days':
                return generateSampleData(7);
            case '14days':
                return generateSampleData(14);
            case '30days':
                return generateSampleData(30);
            case 'custom':
                if (customStart && customEnd) {
                    const start = new Date(customStart);
                    const end = new Date(customEnd);
                    // Add time to end date to include the full day
                    end.setHours(23, 59, 59, 999);
                    const diffTime = end.getTime() - start.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return generateSampleData(diffDays, start, end);
                }
                // If custom is selected but dates not set, return empty array to show user needs to select dates
                return [];
            default:
                return generateSampleData(7);
        }
    };
    
    // Use filtered data for each chart
    const activitySalesData = getFilteredData(activityDateFilter, activityCustomStartDate, activityCustomEndDate);
    const revenueSalesData = getFilteredData(revenueDateFilter, revenueCustomStartDate, revenueCustomEndDate);

    // Add console log to debug
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Activity Date Filter:', activityDateFilter);
    console.log('Activity Sales Data:', activitySalesData);
    console.log('Activity Sales Data Length:', activitySalesData.length);
    console.log('Revenue Date Filter:', revenueDateFilter);
    console.log('Revenue Sales Data:', revenueSalesData);
    console.log('Revenue Sales Data Length:', revenueSalesData.length);
    console.log('=====================');

    const monthlyData = chartData?.monthlyData?.length > 0 ? chartData.monthlyData : [
        { month: 'Jan', revenue: 45000000, target: 50000000 },
        { month: 'Feb', revenue: 52000000, target: 55000000 },
        { month: 'Mar', revenue: 48000000, target: 60000000 },
        { month: 'Apr', revenue: 61000000, target: 65000000 },
        { month: 'Mei', revenue: 55000000, target: 70000000 },
        { month: 'Jun', revenue: 67000000, target: 75000000 },
    ];

    const topProductsData = chartData?.topProducts?.length > 0 ? chartData.topProducts : [
        { name: 'Kopi Arabica', value: 35 },
        { name: 'Teh Hijau', value: 28 },
        { name: 'Roti Bakar', value: 22 },
        { name: 'Sandwich', value: 18 },
        { name: 'Juice', value: 15 },
    ];
    
    // Utility functions for formatting
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    // Check if user is admin
    const isAdmin = user.role?.name === 'admin' || 
                   hasPermission('admin.access') || 
                   hasPermission('*');

    const getComparisonColor = (value: number) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-muted-foreground';
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Penjualan Hari Ini
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.todaySales)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.todayTransactions} transaksi
                            </p>
                        </CardContent>
                    </Card>

                    <PermissionGate permission="report.financial" fallback={
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Transaksi Hari Ini
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.todayTransactions}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    transaksi selesai
                                </p>
                            </CardContent>
                        </Card>
                    }>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Pendapatan Bulan Ini
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(stats.monthlyRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% dari bulan lalu
                                </p>
                            </CardContent>
                        </Card>
                    </PermissionGate>

                    <PermissionGate permission="inventory.view" fallback={
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Status Aktif
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    Online
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Sistem berjalan normal
                                </p>
                            </CardContent>
                        </Card>
                    }>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Status Inventory
                                </CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatNumber(stats.totalProducts)} produk
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.lowStockProducts} stok rendah
                                </p>
                            </CardContent>
                        </Card>
                    </PermissionGate>

                    <PermissionGate permission="customer.view" fallback={
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Shift Anda
                                </CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    8:00
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    jam kerja hari ini
                                </p>
                            </CardContent>
                        </Card>
                    }>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {isAdmin ? 'Total Pelanggan' : 'Pelanggan Aktif'}
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatNumber(stats.totalCustomers)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.newCustomersThisMonth} baru bulan ini
                                </p>
                            </CardContent>
                        </Card>
                    </PermissionGate>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    <PermissionGate permission="report.financial" fallback={
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-blue-500" />
                                            Aktivitas Harian
                                        </CardTitle>
                                        <CardDescription>Transaksi berdasarkan periode</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <select 
                                            value={activityDateFilter}
                                            onChange={(e) => setActivityDateFilter(e.target.value)}
                                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-w-[140px] shadow-sm"
                                        >
                                            {filterOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {activityDateFilter === 'custom' && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="date"
                                            value={activityCustomStartDate}
                                            onChange={(e) => setActivityCustomStartDate(e.target.value)}
                                            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="Start Date"
                                        />
                                        <input
                                            type="date"
                                            value={activityCustomEndDate}
                                            onChange={(e) => setActivityCustomEndDate(e.target.value)}
                                            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="End Date"
                                        />
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {activityDateFilter === 'custom' && (!activityCustomStartDate || !activityCustomEndDate) ? (
                                    <div className="flex items-center justify-center h-[280px]">
                                        <div className="text-center">
                                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-sm">
                                                Silakan pilih tanggal mulai dan tanggal akhir untuk melihat data
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280} key={`activity-${activityDateFilter}-${activityCustomStartDate}-${activityCustomEndDate}`}>
                                        <AreaChart data={activitySalesData}>
                                            <defs>
                                                <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    fontSize: '14px'
                                                }}
                                                formatter={(value: any) => [`${value} transaksi`, 'Total']}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="transactions" 
                                                stroke="#6366f1" 
                                                strokeWidth={3}
                                                fill="url(#colorTransactions)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    }>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-blue-500" />
                                            Aktivitas Harian
                                        </CardTitle>
                                        <CardDescription>Transaksi berdasarkan periode</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <select 
                                            value={activityDateFilter}
                                            onChange={(e) => setActivityDateFilter(e.target.value)}
                                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-w-[140px] shadow-sm"
                                        >
                                            {filterOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {activityDateFilter === 'custom' && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="date"
                                            value={activityCustomStartDate}
                                            onChange={(e) => setActivityCustomStartDate(e.target.value)}
                                            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="Start Date"
                                        />
                                        <input
                                            type="date"
                                            value={activityCustomEndDate}
                                            onChange={(e) => setActivityCustomEndDate(e.target.value)}
                                            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="End Date"
                                        />
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {activityDateFilter === 'custom' && (!activityCustomStartDate || !activityCustomEndDate) ? (
                                    <div className="flex items-center justify-center h-[280px]">
                                        <div className="text-center">
                                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-sm">
                                                Silakan pilih tanggal mulai dan tanggal akhir untuk melihat data
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280} key={`activity-nonAdmin-${activityDateFilter}-${activityCustomStartDate}-${activityCustomEndDate}`}>
                                        <AreaChart data={activitySalesData}>
                                            <defs>
                                                <linearGradient id="colorTransactionsNonAdmin" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    fontSize: '14px'
                                                }}
                                                formatter={(value: any) => [`${value} transaksi`, 'Total']}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="transactions" 
                                                stroke="#6366f1" 
                                                strokeWidth={3}
                                                fill="url(#colorTransactionsNonAdmin)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </PermissionGate>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                        Revenue Harian
                                    </CardTitle>
                                    <CardDescription>Pendapatan berdasarkan periode</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <select 
                                        value={revenueDateFilter}
                                        onChange={(e) => setRevenueDateFilter(e.target.value)}
                                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-w-[140px] shadow-sm"
                                    >
                                        {filterOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {revenueDateFilter === 'custom' && (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="date"
                                        value={revenueCustomStartDate}
                                        onChange={(e) => setRevenueCustomStartDate(e.target.value)}
                                        className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                        placeholder="Start Date"
                                    />
                                    <input
                                        type="date"
                                        value={revenueCustomEndDate}
                                        onChange={(e) => setRevenueCustomEndDate(e.target.value)}
                                        className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                        placeholder="End Date"
                                    />
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {revenueDateFilter === 'custom' && (!revenueCustomStartDate || !revenueCustomEndDate) ? (
                                <div className="flex items-center justify-center h-[280px]">
                                    <div className="text-center">
                                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 text-sm">
                                            Silakan pilih tanggal mulai dan tanggal akhir untuk melihat data
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280} key={`revenue-${revenueDateFilter}-${revenueCustomStartDate}-${revenueCustomEndDate}`}>
                                    <AreaChart data={revenueSalesData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                fontSize: '14px'
                                            }}
                                            formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#10b981" 
                                            strokeWidth={3}
                                            fill="url(#colorRevenue)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <PermissionGate permission="report.financial" fallback={null}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                                        Target vs Realisasi Bulanan
                                    </CardTitle>
                                    <CardDescription>Perbandingan pencapaian target berdasarkan periode</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <select 
                                        value={targetDateFilter}
                                        onChange={(e) => setTargetDateFilter(e.target.value)}
                                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-w-[140px] shadow-sm"
                                    >
                                        <option value="6months">6 Bulan Terakhir</option>
                                        <option value="12months">12 Bulan Terakhir</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                            </div>
                            {targetDateFilter === 'custom' && (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="month"
                                        value={targetCustomStartDate}
                                        onChange={(e) => setTargetCustomStartDate(e.target.value)}
                                        className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                        placeholder="Start Month"
                                    />
                                    <input
                                        type="month"
                                        value={targetCustomEndDate}
                                        onChange={(e) => setTargetCustomEndDate(e.target.value)}
                                        className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                        placeholder="End Month"
                                    />
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="month" 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            fontSize: '14px'
                                        }}
                                        formatter={(value: any, name: string) => [
                                            formatCurrency(value), 
                                            name === 'revenue' ? 'Realisasi' : 'Target'
                                        ]}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        fill="#10b981" 
                                        radius={[4, 4, 0, 0]}
                                        name="revenue"
                                    />
                                    <Bar 
                                        dataKey="target" 
                                        fill="#e5e7eb" 
                                        radius={[4, 4, 0, 0]}
                                        name="target"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </PermissionGate>

                {/* Total Revenue Card */}
                <PermissionGate permission="report.financial" fallback={
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                Revenue Anda
                            </CardTitle>
                            <CardDescription>Total penjualan yang Anda capai</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(stats.todaySales)}
                                    </div>
                                    <p className="text-sm text-blue-600 font-medium">Hari Ini</p>
                                    <p className="text-xs text-blue-500">{stats.todayTransactions} transaksi</p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                    <div className="text-2xl font-bold text-green-700">
                                        {formatCurrency(stats.weeklyRevenue || 0)}
                                    </div>
                                    <p className="text-sm text-green-600 font-medium">Minggu Ini</p>
                                    <p className="text-xs text-green-500">Senin sampai hari ini</p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-700">
                                        {formatCurrency(stats.monthlyRevenue)}
                                    </div>
                                    <p className="text-sm text-purple-600 font-medium">Bulan Ini</p>
                                    <p className="text-xs text-purple-500">
                                        {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% vs bulan lalu
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                }>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                Total Revenue
                            </CardTitle>
                            <CardDescription>Ringkasan pendapatan perusahaan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(stats.todaySales)}
                                    </div>
                                    <p className="text-sm text-blue-600 font-medium">Hari Ini</p>
                                    <p className="text-xs text-blue-500">{stats.todayTransactions} transaksi</p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                    <div className="text-2xl font-bold text-green-700">
                                        {formatCurrency(stats.weeklyRevenue || 0)}
                                    </div>
                                    <p className="text-sm text-green-600 font-medium">Minggu Ini</p>
                                    <p className="text-xs text-green-500">Senin sampai hari ini</p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-700">
                                        {formatCurrency(stats.monthlyRevenue)}
                                    </div>
                                    <p className="text-sm text-purple-600 font-medium">Bulan Ini</p>
                                    <p className="text-xs text-purple-500">
                                        {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% vs bulan lalu
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </PermissionGate>

                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 text-sm font-medium">No.</th>
                                            <th className="text-left py-2 text-sm font-medium">Transaction #</th>
                                            <th className="text-left py-2 text-sm font-medium">Customer</th>
                                            <th className="text-left py-2 text-sm font-medium">Date</th>
                                            <th className="text-left py-2 text-sm font-medium">Total Amount</th>
                                            <th className="text-left py-2 text-sm font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {latestTransactions && latestTransactions.length > 0 ? 
                                            latestTransactions.map((transaction, index) => (
                                                <tr key={transaction.id} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 text-sm">{index + 1}</td>
                                                    <td className="py-3 text-sm font-medium">{transaction.transaction_number}</td>
                                                    <td className="py-3 text-sm">
                                                        <div>
                                                            <p className="font-medium">{transaction.customer_name}</p>
                                                            {transaction.customer_code && (
                                                                <p className="text-xs text-muted-foreground">{transaction.customer_code}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-sm">{transaction.formatted_date}</td>
                                                    <td className="py-3 text-sm font-medium">{formatCurrency(transaction.total_amount)}</td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            transaction.status === 'completed' 
                                                                ? 'bg-green-100 text-green-800'
                                                                : transaction.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {transaction.status === 'completed' ? 'Completed' : 
                                                             transaction.status === 'pending' ? 'Pending' : transaction.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : 
                                            // Fallback to sample data if no real data
                                            [1,2,3,4,5].map((i) => (
                                                <tr key={i} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 text-sm">{i}</td>
                                                    <td className="py-3 text-sm font-medium">TRX{String(Date.now() + i).slice(-9)}</td>
                                                    <td className="py-3 text-sm">
                                                        <div>
                                                            <p className="font-medium">Customer {i}</p>
                                                            <p className="text-xs text-muted-foreground">CUST{String(i).padStart(3, '0')}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-sm">{new Date().toLocaleDateString('id-ID')}</td>
                                                    <td className="py-3 text-sm font-medium">{formatCurrency(150000 * i)}</td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Completed
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {latestTransactions && latestTransactions.length > 0 ? 
                                    latestTransactions.map((transaction, index) => (
                                        <div key={transaction.id} className="bg-muted/20 rounded-lg p-3 border">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{transaction.transaction_number}</p>
                                                    <p className="text-xs text-muted-foreground">{transaction.customer_name}</p>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    transaction.status === 'completed' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : transaction.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {transaction.status === 'completed' ? 'Completed' : 
                                                     transaction.status === 'pending' ? 'Pending' : transaction.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">{formatCurrency(transaction.total_amount)}</p>
                                                <p className="text-xs text-muted-foreground">{transaction.formatted_date}</p>
                                            </div>
                                        </div>
                                    )) : 
                                    // Fallback to sample data if no real data
                                    [1,2,3,4,5].map((i) => (
                                        <div key={i} className="bg-muted/20 rounded-lg p-3 border">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">TRX{String(Date.now() + i).slice(-9)}</p>
                                                    <p className="text-xs text-muted-foreground">Customer {i}</p>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Completed
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">{formatCurrency(150000 * i)}</p>
                                                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('id-ID')}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2 sm:gap-3">
                                <PermissionGate permission="transaction.create" fallback={null}>
                                    <Button 
                                        className="w-full justify-start h-10 sm:h-12 text-sm"
                                        onClick={() => router.visit('/pos/cashier')}
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">Point of Sale</span>
                                    </Button>
                                </PermissionGate>
                                
                                <PermissionGate permission="transaction.view" fallback={null}>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start h-10 sm:h-12 text-sm"
                                        onClick={() => router.visit('/sales/transactions')}
                                    >
                                        <Calculator className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">Sales Management</span>
                                    </Button>
                                </PermissionGate>

                                <PermissionGate permission="inventory.view" fallback={null}>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start h-10 sm:h-12 text-sm"
                                        onClick={() => router.visit('/inventory')}
                                    >
                                        <Package className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">Inventory</span>
                                    </Button>
                                </PermissionGate>

                                <PermissionGate permission="customer.view" fallback={null}>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start h-10 sm:h-12 text-sm"
                                        onClick={() => router.visit('/master-data/customers')}
                                    >
                                        <Users className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">Customers</span>
                                    </Button>
                                </PermissionGate>

                                {isAdmin && (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            className="w-full justify-start h-10 sm:h-12 text-sm"
                                            onClick={() => router.visit('/reports')}
                                        >
                                            <BarChart3 className="mr-2 h-4 w-4 shrink-0" />
                                            <span className="truncate">Reports</span>
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full justify-start h-10 sm:h-12 text-sm"
                                            onClick={() => router.visit('/master-data')}
                                        >
                                            <Store className="mr-2 h-4 w-4 shrink-0" />
                                            <span className="truncate">Master Data</span>
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full justify-start h-10 sm:h-12 text-sm"
                                            onClick={() => router.visit('/settings')}
                                        >
                                            <Settings className="mr-2 h-4 w-4 shrink-0" />
                                            <span className="truncate">Settings</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
