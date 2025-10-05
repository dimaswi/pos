import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsDashboard } from '@/components/reports/analytics-dashboard';
import { 
    BarChart3,
    TrendingUp,
    Package,
    DollarSign,
    Eye,
    Download,
    Calendar,
    Store as StoreIcon,
    FileText,
    PieChart,
    Activity
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
}

interface Props {
    stores: Store[];
    quickStats: QuickStats;
}

export default function Analytics({ stores, quickStats }: Props) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStoreId, setSelectedStoreId] = useState('all');

    const TabButton = ({ value, children, isActive, onClick }: {
        value: string;
        children: React.ReactNode;
        isActive: boolean;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors w-full ${
                isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
            {children}
        </button>
    );

    const TabContent = ({ value, children }: {
        value: string;
        children: React.ReactNode;
    }) => {
        if (activeTab !== value) return null;
        return <div className="space-y-6">{children}</div>;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title="Analytics Dashboard" />
            
            <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Header Section */}
                <div className="bg-card border rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-tight">Analytics Dashboard</h1>
                                <Badge variant="secondary" className="text-xs mt-1">
                                    Real-time Analytics
                                </Badge>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                                <Activity className="h-3 w-3 mr-1" />
                                Live
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Analisis data bisnis real-time dengan insights mendalam untuk pengambilan keputusan strategis
                        </p>
                    </div>
                </div>

                {/* Store Selector */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <StoreIcon className="h-4 w-4 text-muted-foreground" />
                            Filter Toko
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                            <Badge
                                variant={selectedStoreId === 'all' ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-muted transition-colors text-xs px-2 py-1"
                                onClick={() => setSelectedStoreId('all')}
                            >
                                Semua Toko
                            </Badge>
                            {stores.map((store) => (
                                <Badge
                                    key={store.id}
                                    variant={selectedStoreId === store.id.toString() ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-muted transition-colors text-xs px-2 py-1 truncate max-w-[100px] sm:max-w-[150px] lg:max-w-none"
                                    onClick={() => setSelectedStoreId(store.id.toString())}
                                    title={store.name}
                                >
                                    {store.name}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation Tabs */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-3">
                            <CardTitle className="text-sm sm:text-base font-bold">Analytics Modules</CardTitle>
                            <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                4 Modules
                            </Badge>
                        </div>
                        <div className="border-b">
                            <div className="grid grid-cols-2 gap-1 pb-3">
                                <TabButton 
                                    value="overview" 
                                    isActive={activeTab === 'overview'} 
                                    onClick={() => setActiveTab('overview')}
                                >
                                    <BarChart3 className="h-3 w-3 mr-1 inline" />
                                    <span className="text-xs">Overview</span>
                                </TabButton>
                                <TabButton 
                                    value="sales" 
                                    isActive={activeTab === 'sales'} 
                                    onClick={() => setActiveTab('sales')}
                                >
                                    <TrendingUp className="h-3 w-3 mr-1 inline" />
                                    <span className="text-xs">Sales</span>
                                </TabButton>
                                <TabButton 
                                    value="products" 
                                    isActive={activeTab === 'products'} 
                                    onClick={() => setActiveTab('products')}
                                >
                                    <Package className="h-3 w-3 mr-1 inline" />
                                    <span className="text-xs">Product</span>
                                </TabButton>
                                <TabButton 
                                    value="financial" 
                                    isActive={activeTab === 'financial'} 
                                    onClick={() => setActiveTab('financial')}
                                >
                                    <DollarSign className="h-3 w-3 mr-1 inline" />
                                    <span className="text-xs">Finance</span>
                                </TabButton>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                        {/* Tab Content */}
                        <TabContent value="overview">
                            <AnalyticsDashboard 
                                stores={stores}
                                selectedStoreId={selectedStoreId}
                                onStoreChange={setSelectedStoreId}
                            />
                        </TabContent>

                        <TabContent value="sales">
                            <div className="flex items-center justify-center min-h-[200px] sm:min-h-[250px]">
                                <div className="text-center space-y-3 max-w-sm px-4">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <TrendingUp className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm sm:text-base font-semibold text-foreground">Laporan Penjualan</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Analisis detail penjualan dan tren performa bisnis</p>
                                        <Link href={route('reports.sales')}>
                                            <Button variant="outline" size="sm" className="mt-3 w-full">
                                                <FileText className="h-3 w-3 mr-2" />
                                                <span className="text-xs">Buka Laporan Penjualan</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </TabContent>

                        <TabContent value="products">
                            <div className="flex items-center justify-center min-h-[200px] sm:min-h-[250px]">
                                <div className="text-center space-y-3 max-w-sm px-4">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm sm:text-base font-semibold text-foreground">Laporan Inventaris</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Analisis stok dan pergerakan produk inventaris</p>
                                        <Link href={route('reports.inventory')}>
                                            <Button variant="outline" size="sm" className="mt-3 w-full">
                                                <Package className="h-3 w-3 mr-2" />
                                                <span className="text-xs">Buka Laporan Inventaris</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </TabContent>

                        <TabContent value="financial">
                            <div className="flex items-center justify-center min-h-[200px] sm:min-h-[250px]">
                                <div className="text-center space-y-3 max-w-sm px-4">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <DollarSign className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm sm:text-base font-semibold text-foreground">Laporan Keuangan</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Analisis profit, cash flow dan performa keuangan</p>
                                        <Link href={route('reports.financial')}>
                                            <Button variant="outline" size="sm" className="mt-3 w-full">
                                                <DollarSign className="h-3 w-3 mr-2" />
                                                <span className="text-xs">Buka Laporan Keuangan</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </TabContent>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
