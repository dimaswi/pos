import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from './simple-charts';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShoppingCart, 
    Package,
    RefreshCw,
    Clock
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
    const [period, setPeriod] = useState('7days');
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

            const response = await fetch(`/api/analytics/dashboard?${params}`);
            if (response.ok) {
                const data = await response.json();
                setDashboardData(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
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

    if (loading || !dashboardData) {
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
            </div>
        );
    }

    const summaryCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(dashboardData.summary.total_revenue),
            icon: DollarSign,
            trend: 12,
            color: 'bg-gray-700',
        },
        {
            title: 'Total Transaksi',
            value: dashboardData.summary.total_transactions.toLocaleString(),
            icon: ShoppingCart,
            trend: 8,
            color: 'bg-gray-600',
        },
        {
            title: 'Rata-rata Transaksi',
            value: formatCurrency(dashboardData.summary.average_transaction),
            icon: TrendingUp,
            trend: 5,
            color: 'bg-gray-800',
        },
        {
            title: 'Total Items',
            value: dashboardData.summary.total_items.toLocaleString(),
            icon: Package,
            trend: -2,
            color: 'bg-gray-500',
        },
    ];

    const chartData = {
        daily: dashboardData.daily_data.map(d => ({
            label: new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
            value: d.revenue,
            date: d.date
        })),
        products: dashboardData.top_products.slice(0, 5).map(p => ({
            label: p.product.name,
            value: p.total_revenue
        })),
        payments: dashboardData.payment_breakdown.map(p => ({
            label: p.method,
            value: p.total_amount
        })),
        stores: dashboardData.store_performance.map(s => ({
            label: s.store_name,
            value: s.revenue
        }))
    };

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="today">Hari Ini</option>
                        <option value="7days">7 Hari Terakhir</option>
                        <option value="30days">30 Hari Terakhir</option>
                        <option value="90days">90 Hari Terakhir</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                    <Button variant="ghost" size="sm" onClick={fetchRealtimeData}>
                        <RefreshCw className="h-4 w-4" />
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
                                            <TrendingUp className="h-4 w-4 text-gray-600 mr-1" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-gray-500 mr-1" />
                                        )}
                                        <span className={
                                            card.trend > 0 ? 'text-gray-700' : 'text-gray-600'
                                        }>
                                            {card.trend > 0 ? '+' : ''}{card.trend}%
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleLineChart
                    title="Tren Revenue Harian"
                    data={chartData.daily}
                    height={200}
                    valueFormatter={formatCurrency}
                />
                
                <SimplePieChart
                    title="Metode Pembayaran"
                    data={chartData.payments}
                    height={200}
                />
            </div>

            {/* Real-time Section */}
            {realtimeData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                            Real-time Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Revenue Hari Ini</p>
                                <div className="text-2xl font-bold text-gray-800">
                                    {formatCurrency(realtimeData.current.revenue)}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Transaksi Hari Ini</p>
                                <div className="text-2xl font-bold text-gray-700">
                                    {realtimeData.current.transactions}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Rata-rata per Transaksi</p>
                                <div className="text-xl font-bold text-gray-600">
                                    {formatCurrency(realtimeData.current.average_transaction)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bottom Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleBarChart
                    title="Top Products"
                    data={chartData.products}
                    height={250}
                    valueFormatter={formatCurrency}
                />
                
                {dashboardData.store_performance.length > 1 && (
                    <SimpleBarChart
                        title="Performa per Toko"
                        data={chartData.stores}
                        height={250}
                        valueFormatter={formatCurrency}
                    />
                )}
            </div>
        </div>
    );
};
