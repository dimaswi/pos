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
            
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Header */}
                <div className="bg-card border rounded-lg p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Laporan</h1>
                                    <Badge variant="secondary" className="text-xs mt-1">
                                        Management Portal
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-2xl">
                                Pusat analisis performa bisnis dengan insights real-time untuk pengambilan keputusan strategis
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Live Data
                            </Badge>
                            <Button variant="outline" size="sm" className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {quickStatsCards.map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={index} className="relative overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                                    <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium text-muted-foreground truncate">
                                                    {stat.title}
                                                </p>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                                                {stat.value}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                        <div className="flex items-center gap-1">
                                            {stat.trendUp ? (
                                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                            )}
                                            <span className={`text-sm font-semibold ${
                                                stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">vs kemarin</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Report Types */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-lg p-4 sm:p-6 shadow-sm">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Jenis Laporan</h2>
                            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                                Pilih laporan yang ingin Anda analisis untuk mendapatkan insights mendalam tentang performa bisnis
                            </p>
                            <div className="flex justify-center pt-2">
                                <Badge variant="outline" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    3 Kategori Laporan
                                </Badge>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Analytics Dashboard Featured Card */}
                    <div className="lg:col-span-3 mb-6">
                        <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 relative overflow-hidden">
                            {/* Subtle Pattern Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-900/50 dark:to-gray-800/30"></div>
                            
                            <CardHeader className="pb-4 relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border shadow-sm group-hover:shadow-md transition-all duration-300">
                                            <BarChart3 className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-xl font-bold text-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300">
                                                Analytics Dashboard
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                Dashboard analytics real-time dengan visualisasi chart dan insights bisnis yang komprehensif
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="self-start px-3 py-1">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Premium
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 relative z-10">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-900/60 border">
                                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Real-time</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-900/60 border">
                                            <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Interactive</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-900/60 border">
                                            <div className="w-2 h-2 bg-gray-700 dark:bg-gray-300 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Multi-store</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-900/60 border">
                                            <div className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Advanced</span>
                                        </div>
                                    </div>
                                    
                                    <Link
                                        href={route('reports.analytics')}
                                        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 border border-transparent rounded-lg hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 w-full sm:w-auto group-hover:scale-105"
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        <span>Buka Dashboard</span>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Standard Report Cards */}
                    {reportTypes.map((report, index) => {
                        const IconComponent = report.icon;
                        return (
                            <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border relative overflow-hidden bg-card">
                                {/* Subtle Background Pattern */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/20 dark:from-gray-900/30 dark:to-gray-800/20"></div>
                                
                                <CardHeader className="pb-4 relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border shadow-sm group-hover:shadow-md transition-all duration-300">
                                            <IconComponent className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Detail
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300">
                                            {report.title}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {report.description}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 relative z-10">
                                    <div className="space-y-4">
                                        {/* Features Grid */}
                                        <div className="grid grid-cols-1 gap-2">
                                            {report.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center text-sm text-muted-foreground bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 border">
                                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mr-3 flex-shrink-0"></div>
                                                    <span className="leading-relaxed font-medium">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Action Button */}
                                        <Link
                                            href={report.href}
                                            className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 border border-transparent rounded-lg hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 group-hover:scale-105"
                                        >
                                            <IconComponent className="h-4 w-4 mr-2" />
                                            <span>Buka Laporan</span>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                Aksi Cepat
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                4 Shortcuts
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Akses cepat ke laporan dan fungsi penting</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href={route('reports.sales')} className="group">
                                <div className="p-4 border rounded-lg hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 bg-card">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:shadow-sm transition-shadow">
                                            <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-sm text-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                                Penjualan Hari Ini
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                Lihat detail transaksi hari ini
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href={route('reports.inventory')} className="group">
                                <div className="p-4 border rounded-lg hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 bg-card">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:shadow-sm transition-shadow">
                                            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-sm text-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                                Stok Rendah
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                {quickStats.lowStockProducts} produk perlu perhatian
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href={route('reports.financial')} className="group">
                                <div className="p-4 border rounded-lg hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 bg-card">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:shadow-sm transition-shadow">
                                            <PieChart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-sm text-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                                Keuangan Bulan Ini
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                Analisis keuangan bulanan
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="group cursor-pointer">
                                <div className="p-4 border rounded-lg hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 bg-card">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:shadow-sm transition-shadow">
                                            <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-sm text-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                                Export Laporan
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                Download Excel/PDF
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
