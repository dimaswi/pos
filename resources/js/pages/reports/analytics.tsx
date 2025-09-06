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
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
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
            
            <div className="p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-gray-600">Analisis data bisnis real-time dan insights</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            Live Analytics
                        </Badge>
                    </div>
                </div>

                {/* Store Selector */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <StoreIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Filter Toko:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {stores.map((store) => (
                                    <Badge
                                        key={store.id}
                                        variant={selectedStoreId === store.id.toString() ? 'default' : 'outline'}
                                        className="cursor-pointer hover:bg-gray-100"
                                        onClick={() => setSelectedStoreId(store.id.toString())}
                                    >
                                        {store.name}
                                    </Badge>
                                ))}
                                <Badge
                                    variant={selectedStoreId === 'all' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-gray-100"
                                    onClick={() => setSelectedStoreId('all')}
                                >
                                    Semua Toko
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation Tabs */}
                <Card>
                    <CardHeader className="pb-0">
                        <div className="border-b border-gray-200">
                            <div className="flex space-x-1 pb-4">
                                <TabButton 
                                    value="overview" 
                                    isActive={activeTab === 'overview'} 
                                    onClick={() => setActiveTab('overview')}
                                >
                                    <BarChart3 className="h-4 w-4 mr-2 inline" />
                                    Overview
                                </TabButton>
                                <TabButton 
                                    value="sales" 
                                    isActive={activeTab === 'sales'} 
                                    onClick={() => setActiveTab('sales')}
                                >
                                    <TrendingUp className="h-4 w-4 mr-2 inline" />
                                    Penjualan
                                </TabButton>
                                <TabButton 
                                    value="products" 
                                    isActive={activeTab === 'products'} 
                                    onClick={() => setActiveTab('products')}
                                >
                                    <Package className="h-4 w-4 mr-2 inline" />
                                    Produk
                                </TabButton>
                                <TabButton 
                                    value="financial" 
                                    isActive={activeTab === 'financial'} 
                                    onClick={() => setActiveTab('financial')}
                                >
                                    <DollarSign className="h-4 w-4 mr-2 inline" />
                                    Keuangan
                                </TabButton>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                        {/* Tab Content */}
                        <TabContent value="overview">
                            <AnalyticsDashboard 
                                stores={stores}
                                selectedStoreId={selectedStoreId}
                                onStoreChange={setSelectedStoreId}
                            />
                        </TabContent>

                        <TabContent value="sales">
                            <div className="flex items-center justify-center h-48">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <BarChart3 className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Laporan Penjualan</h3>
                                        <p className="text-gray-500 mb-4">Analisis detail penjualan dan tren</p>
                                        <Link href={route('reports.sales')}>
                                            <Button variant="outline">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Buka Laporan Penjualan
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </TabContent>

                        <TabContent value="products">
                            <div className="flex items-center justify-center h-48">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <Package className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Laporan Inventaris</h3>
                                        <p className="text-gray-500 mb-4">Analisis stok dan pergerakan produk</p>
                                        <Link href={route('reports.inventory')}>
                                            <Button variant="outline">
                                                <Package className="h-4 w-4 mr-2" />
                                                Buka Laporan Inventaris
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </TabContent>

                        <TabContent value="financial">
                            <div className="flex items-center justify-center h-48">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <DollarSign className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Laporan Keuangan</h3>
                                        <p className="text-gray-500 mb-4">Analisis profit dan cash flow</p>
                                        <Link href={route('reports.financial')}>
                                            <Button variant="outline">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                Buka Laporan Keuangan
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
