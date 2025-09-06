import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Charts removed per user request
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShoppingCart, 
    Package,
    RefreshCw,
    Clock,
    Activity
} from 'lucide-react';

interface AnalyticsDashboardProps {
    stores: Array<{ id: number; name: string; code: string }>;
    selectedStoreId?: string;
    onStoreChange?: (storeId: string) => void;
}

interface DashboardData {
    summary: {
        total_revenue: number;
        total_transactions: number;
        average_transaction: number;
        total_items: number;
        revenue_growth?: number;
        transaction_growth?: number;
        items_growth?: number;
    };
    daily_data: Array<{
        date: string;
        revenue: number;
        transactions: number;
        items: number;
    }>;
    top_products: Array<{
        product: { name: string };
        total_quantity: number;
        total_revenue: number;
    }>;
    store_performance: Array<{
        store_name: string;
        revenue: number;
        transactions: number;
        average_transaction: number;
    }>;
    payment_breakdown: Array<{
        method: string;
        total_amount: number;
        transaction_count: number;
        percentage: number;
    }>;
}

interface RealtimeData {
    current: {
        revenue: number;
        transactions: number;
        average_transaction: number;
    };
    growth: {
        revenue: number;
        transactions: number;
    };
    hourly_data: Array<{
        hour: number;
        revenue: number;
        transactions: number;
    }>;
    last_update: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    stores,
    selectedStoreId = 'all',
    onStoreChange
}) => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams({
                period,
                store_id: selectedStoreId
            });

            const url = `/api/analytics/dashboard?${params}`;

            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data received:', data);
                console.log('Period:', period);
                console.log('Summary:', data.summary);
                console.log('Daily data count:', data.daily_data?.length);
                setDashboardData(data);
            } else {
                console.error('Failed to fetch dashboard data:', response.status);
                // Set empty data structure to prevent errors
                setDashboardData({
                    summary: {
                        total_revenue: 0,
                        total_transactions: 0,
                        average_transaction: 0,
                        total_items: 0,
                        revenue_growth: 0,
                        transaction_growth: 0,
                        items_growth: 0
                    },
                    daily_data: [],
                    top_products: [],
                    store_performance: [],
                    payment_breakdown: []
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Set empty data structure to prevent errors
            setDashboardData({
                summary: {
                    total_revenue: 0,
                    total_transactions: 0,
                    average_transaction: 0,
                    total_items: 0,
                    revenue_growth: 0,
                    transaction_growth: 0,
                    items_growth: 0
                },
                daily_data: [],
                top_products: [],
                store_performance: [],
                payment_breakdown: []
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRealtimeData = async () => {
        try {
            const params = new URLSearchParams({
                store_id: selectedStoreId
            });

            const response = await fetch(`/api/analytics/realtime?${params}`);
            if (response.ok) {
                const data = await response.json();
                setRealtimeData(data);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Error fetching realtime data:', error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchRealtimeData();
    }, [selectedStoreId, period]);

    useEffect(() => {
        const interval = setInterval(fetchRealtimeData, 30000); // Refresh setiap 30 detik
        return () => clearInterval(interval);
    }, [selectedStoreId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1,2].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="h-48 bg-gray-200 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // If not loading but no data yet, show empty state
    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-gray-500 mb-2">Tidak ada data tersedia</div>
                    <Button onClick={fetchDashboardData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Muat Ulang
                    </Button>
                </div>
            </div>
        );
    }

    const summaryCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(Number(dashboardData.summary?.total_revenue) || 0),
            icon: DollarSign,
            trend: Number(dashboardData.summary?.revenue_growth) || 0,
            color: 'bg-blue-500',
        },
        {
            title: 'Total Transaksi',
            value: (Number(dashboardData.summary?.total_transactions) || 0).toLocaleString(),
            icon: ShoppingCart,
            trend: Number(dashboardData.summary?.transaction_growth) || 0,
            color: 'bg-green-500',
        },
        {
            title: 'Rata-rata Transaksi',
            value: formatCurrency(Number(dashboardData.summary?.average_transaction) || 0),
            icon: TrendingUp,
            trend: Number(dashboardData.summary?.revenue_growth) || 0, // Use revenue growth as proxy
            color: 'bg-purple-500',
        },
        {
            title: 'Total Items',
            value: (Number(dashboardData.summary?.total_items) || 0).toLocaleString(),
            icon: Package,
            trend: Number(dashboardData.summary?.items_growth) || 0,
            color: 'bg-orange-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Periode:</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="today">Hari Ini</option>
                            <option value="7days">7 Hari Terakhir</option>
                            <option value="30days">30 Hari Terakhir</option>
                            <option value="90days">90 Hari Terakhir</option>
                        </select>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        {loading ? 'Loading...' : 'Live'}
                    </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            fetchDashboardData();
                            fetchRealtimeData();
                        }}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {card.title}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {card.value}
                                        </p>
                                        <div className="flex items-center mt-2">
                                        {card.trend > 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                        ) : card.trend < 0 ? (
                                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                        ) : (
                                            <div className="h-4 w-4 mr-1" />
                                        )}
                                        <span className={
                                            card.trend > 0 ? 'text-green-700' : 
                                            card.trend < 0 ? 'text-red-600' : 'text-gray-500'
                                        }>
                                            {card.trend === 0 ? '0%' : 
                                             card.trend > 0 ? `+${card.trend.toFixed(1)}%` : 
                                             `${card.trend.toFixed(1)}%`}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">
                                            vs periode sebelumnya
                                        </span>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-full ${card.color} bg-opacity-10`}>
                                        <IconComponent className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Data Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Revenue Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {period === 'today' ? 'Tren Revenue per Jam' : 'Tren Revenue Harian'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardData?.daily_data?.length > 0 ? (
                            <div className="overflow-auto max-h-48">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">
                                                {period === 'today' ? 'Jam' : 'Tanggal'}
                                            </th>
                                            <th className="text-right p-2">Revenue</th>
                                            <th className="text-right p-2">Transaksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.daily_data.map((day, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">
                                                    {period === 'today' 
                                                        ? day.date  // For today, show hour format (H:i)
                                                        : new Date(day.date).toLocaleDateString('id-ID')
                                                    }
                                                </td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatCurrency(Number(day.revenue) || 0)}
                                                </td>
                                                <td className="p-2 text-right">
                                                    {Number(day.transactions) || 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Tidak ada data untuk periode ini
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Payment Methods Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Metode Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardData?.payment_breakdown?.length > 0 ? (
                            <div className="overflow-auto max-h-48">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Metode</th>
                                            <th className="text-right p-2">Total</th>
                                            <th className="text-right p-2">Persentase</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.payment_breakdown.map((payment, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">{payment.method}</td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatCurrency(Number(payment.total_amount) || 0)}
                                                </td>
                                                <td className="p-2 text-right">
                                                    {Number(payment.percentage || 0).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Tidak ada data pembayaran
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Real-time Section */}
            {realtimeData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Real-time Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Revenue Hari Ini</p>
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(Number(realtimeData.current?.revenue) || 0)}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Transaksi Hari Ini</p>
                                <div className="text-2xl font-bold text-green-600">
                                    {Number(realtimeData.current?.transactions) || 0}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Rata-rata per Transaksi</p>
                                <div className="text-xl font-bold text-purple-600">
                                    {formatCurrency(Number(realtimeData.current?.average_transaction) || 0)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Product and Store Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardData?.top_products?.length > 0 ? (
                            <div className="overflow-auto max-h-60">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Produk</th>
                                            <th className="text-right p-2">Qty</th>
                                            <th className="text-right p-2">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.top_products.slice(0, 5).map((product, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">{product.product?.name || `Product ${index + 1}`}</td>
                                                <td className="p-2 text-right">{Number(product.total_quantity) || 0}</td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatCurrency(Number(product.total_revenue) || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Tidak ada data produk
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Store Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performa per Toko</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardData?.store_performance?.length > 0 ? (
                            <div className="overflow-auto max-h-60">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Toko</th>
                                            <th className="text-right p-2">Revenue</th>
                                            <th className="text-right p-2">Transaksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.store_performance.map((store, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">{store.store_name}</td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatCurrency(Number(store.revenue) || 0)}
                                                </td>
                                                <td className="p-2 text-right">{Number(store.transactions) || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                {(dashboardData?.store_performance || []).length === 0 
                                    ? 'Tidak ada data toko' 
                                    : 'Data hanya untuk satu toko'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
