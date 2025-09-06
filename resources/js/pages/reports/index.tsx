import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShoppingCart, 
    Package, 
    AlertTriangle,
    BarChart3,
    FileText,
    PieChart,
    Calendar,
    Store as StoreIcon,
    Eye,
    Download,
    RefreshCw
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Store {
    id: number;
    name: string;
    code: string;
}

interface QuickStats {
    todaySales: number;
    monthSales: number;
    todayTransactions: number;
    lowStockProducts: number;
    todaySalesGrowth: number;
    monthSalesGrowth: number;
    transactionGrowth: number;
    stockChange: number;
}

interface Props {
    stores: Store[];
    quickStats: QuickStats;
}

export default function ReportsIndex({ stores, quickStats }: Props) {
    const { auth } = usePage().props as any;
    const [selectedPeriod, setSelectedPeriod] = useState('today');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const quickStatsCards = [
        {
            title: 'Penjualan Hari Ini',
            value: formatCurrency(quickStats.todaySales),
            icon: DollarSign,
            trend: `${quickStats.todaySalesGrowth > 0 ? '+' : ''}${quickStats.todaySalesGrowth}%`,
            trendUp: quickStats.todaySalesGrowth > 0,
            color: 'bg-blue-500',
        },
        {
            title: 'Penjualan Bulan Ini',
            value: formatCurrency(quickStats.monthSales),
            icon: TrendingUp,
            trend: `${quickStats.monthSalesGrowth > 0 ? '+' : ''}${quickStats.monthSalesGrowth}%`,
            trendUp: quickStats.monthSalesGrowth > 0,
            color: 'bg-green-500',
        },
        {
            title: 'Transaksi Hari Ini',
            value: quickStats.todayTransactions.toString(),
            icon: ShoppingCart,
            trend: `${quickStats.transactionGrowth > 0 ? '+' : ''}${quickStats.transactionGrowth}%`,
            trendUp: quickStats.transactionGrowth > 0,
            color: 'bg-purple-500',
        },
        {
            title: 'Stok Rendah',
            value: quickStats.lowStockProducts.toString(),
            icon: AlertTriangle,
            trend: `${quickStats.stockChange > 0 ? '+' : ''}${quickStats.stockChange}%`,
            trendUp: quickStats.stockChange > 0,
            color: 'bg-orange-500',
        },
    ];

    const reportTypes = [
        {
            title: 'Laporan Penjualan',
            description: 'Analisis penjualan per periode, toko, dan produk',
            icon: BarChart3,
            href: route('reports.sales'),
            color: 'bg-blue-500',
            features: ['Grafik penjualan', 'Top produk', 'Performa kasir', 'Export data']
        },
        {
            title: 'Laporan Inventaris',
            description: 'Monitoring stok, pergerakan barang, dan nilai inventory',
            icon: Package,
            href: route('reports.inventory'),
            color: 'bg-green-500',
            features: ['Status stok', 'Pergerakan barang', 'Nilai inventory', 'Analisis kategori']
        },
        {
            title: 'Laporan Keuangan',
            description: 'Analisis profit, cash flow, dan performa keuangan',
            icon: PieChart,
            href: route('reports.financial'),
            color: 'bg-purple-500',
            features: ['Profit & Loss', 'Cash flow', 'Metode pembayaran', 'Margin analysis']
        },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard Laporan" />
            
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Laporan</h1>
                        <p className="text-gray-600">Analisis performa bisnis dan insights terkini</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Store Info */}
                {stores.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <StoreIcon className="h-5 w-5 text-gray-600" />
                                Info Toko ({stores.length} toko)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {stores.slice(0, 5).map((store) => (
                                    <Badge key={store.id} variant="secondary" className="px-3 py-1">
                                        {store.name}
                                    </Badge>
                                ))}
                                {stores.length > 5 && (
                                    <Badge variant="outline" className="px-3 py-1">
                                        +{stores.length - 5} toko lainnya
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickStatsCards.map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={index} className="relative overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">
                                                {stat.title}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                                            <IconComponent className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-4">
                                        {stat.trendUp ? (
                                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                        )}
                                        <span className={`text-sm font-medium ${
                                            stat.trendUp ? 'text-green-700' : 'text-red-600'
                                        }`}>
                                            {stat.trend}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-1">vs kemarin</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Report Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Analytics Dashboard Featured Card */}
                    <div className="lg:col-span-3 mb-4">
                        <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-blue-100">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-lg bg-blue-100">
                                            <TrendingUp className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl group-hover:text-blue-700 transition-colors">
                                                Analytics Dashboard
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Dashboard analytics real-time dengan visualisasi chart dan insights bisnis
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                        <Eye className="h-3 w-3 mr-1" />
                                        NEW
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            Real-time dashboard
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                            Interactive charts
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                            Multi-store analytics
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                            Advanced insights
                                        </div>
                                    </div>
                                    
                                    <Link
                                        href={route('reports.analytics')}
                                        className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                    >
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Buka Analytics
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Standard Report Cards */}
                    {reportTypes.map((report, index) => {
                        const IconComponent = report.icon;
                        return (
                            <Card key={index} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-3 rounded-lg ${report.color} bg-opacity-10`}>
                                            <IconComponent className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                                        </div>
                                        <Badge variant="outline">
                                            <Eye className="h-3 w-3 mr-1" />
                                            Lihat
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg group-hover:text-gray-700 transition-colors">
                                            {report.title}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600">
                                            {report.description}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            {report.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center text-sm text-gray-600">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Link
                                            href={report.href}
                                            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                                        >
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Buka Laporan
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-600" />
                            Aksi Cepat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href={route('reports.sales')} className="group">
                                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 group-hover:text-blue-700">
                                                Penjualan Hari Ini
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Lihat detail transaksi hari ini
                                            </p>
                                        </div>
                                        <BarChart3 className="h-8 w-8 text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                </div>
                            </Link>

                            <Link href={route('reports.inventory')} className="group">
                                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 group-hover:text-green-700">
                                                Stok Rendah
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {quickStats.lowStockProducts} produk perlu perhatian
                                            </p>
                                        </div>
                                        <AlertTriangle className="h-8 w-8 text-gray-400 group-hover:text-orange-600" />
                                    </div>
                                </div>
                            </Link>

                            <Link href={route('reports.financial')} className="group">
                                <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 group-hover:text-purple-700">
                                                Performa Bulan Ini
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Analisis keuangan bulanan
                                            </p>
                                        </div>
                                        <PieChart className="h-8 w-8 text-gray-400 group-hover:text-purple-600" />
                                    </div>
                                </div>
                            </Link>

                            <div className="group cursor-pointer">
                                <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 group-hover:text-indigo-700">
                                                Export Laporan
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Download dalam format Excel/PDF
                                            </p>
                                        </div>
                                        <Download className="h-8 w-8 text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
