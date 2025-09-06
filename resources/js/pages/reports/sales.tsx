import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { 
    TrendingUp, 
    DollarSign, 
    ShoppingCart, 
    Package,
    Download,
    Filter,
    RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PermissionGate from '@/components/permission-gate';

// Currency formatting utility
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Number formatting utility
const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
};

interface Store {
    id: number;
    name: string;
    code: string;
}

interface Product {
    id: number;
    name: string;
}

interface Transaction {
    id: number;
    transaction_number: string;
    total_amount: number;
    transaction_date: string;
    created_at: string;
    store: Store;
    user: {
        name: string;
    };
    sales_items: Array<{
        product: Product;
        quantity: number;
        unit_price: number;
        total_amount: number;
    }>;
}

interface Summary {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    totalItems: number;
}

interface TopProduct {
    name: string;
    total_quantity: number;
    total_revenue: number;
}

interface Props {
    stores: Store[];
    transactions: Transaction[];
    summary: Summary;
    topProducts: TopProduct[];
    chartData: Record<string, number>;
    filters: {
        store_id?: string;
        start_date: string;
        end_date: string;
        group_by: string;
    };
}

export default function SalesReport({ stores, transactions, summary, topProducts, chartData, filters }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get(route('reports.sales'), localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const exportReport = (format: string) => {
        router.post(route('reports.export'), {
            type: 'sales',
            format,
            ...localFilters
        });
    };

    // Prepare options for searchable selects
    const storeOptions = [
        { value: '', label: 'Semua Toko' },
        ...stores.map(store => ({
            value: store.id.toString(),
            label: store.name
        }))
    ];

    const groupByOptions = [
        { value: 'day', label: 'Harian' },
        { value: 'week', label: 'Mingguan' },
        { value: 'month', label: 'Bulanan' }
    ];

    return (
        <AppLayout>
            <Head title="Laporan Penjualan" />

            <div className="flex justify-between items-center mb-6">
                <PermissionGate permission="report.export">
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => exportReport('pdf')}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => exportReport('excel')}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                    </div>
                </PermissionGate>
            </div>

            <div className="space-y-6">{/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Laporan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Toko</label>
                                <SearchableSelect
                                    value={localFilters.store_id || ''}
                                    onValueChange={(value) => handleFilterChange('store_id', value)}
                                    options={storeOptions}
                                    placeholder="Pilih Toko"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Tanggal Mulai</label>
                                <Input
                                    type="date"
                                    value={localFilters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Tanggal Akhir</label>
                                <Input
                                    type="date"
                                    value={localFilters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Periode</label>
                                <SearchableSelect
                                    value={localFilters.group_by}
                                    onValueChange={(value) => handleFilterChange('group_by', value)}
                                    options={groupByOptions}
                                    placeholder="Pilih Periode"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                            <Button onClick={applyFilters}>
                                Terapkan Filter
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    setLocalFilters({
                                        start_date: '',
                                        end_date: '',
                                        group_by: 'day'
                                    });
                                    router.get(route('reports.sales'));
                                }}
                            >
                                Reset Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary.totalSales)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Revenue total periode ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatNumber(summary.totalTransactions)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Jumlah transaksi
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(summary.averageTransaction)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Nilai rata-rata per transaksi
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatNumber(summary.totalItems)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Jumlah item terjual
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Produk Terlaris
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-gray-600">{formatNumber(product.total_quantity)} unit</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(product.total_revenue)}</p>
                                        <Badge variant="outline">#{index + 1}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Chart Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Grafik Penjualan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(chartData).map(([date, amount]) => (
                                <div key={date} className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{date}</span>
                                    <span className="font-bold">{formatCurrency(amount)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Detail Transaksi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">No. Transaksi</TableHead>
                                    <TableHead className="font-semibold">Tanggal</TableHead>
                                    <TableHead className="font-semibold">Toko</TableHead>
                                    <TableHead className="font-semibold">Kasir</TableHead>
                                    <TableHead className="font-semibold">Items</TableHead>
                                    <TableHead className="text-right font-semibold">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map((transaction) => (
                                    <TableRow key={transaction.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
                                        <TableCell>
                                            {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{transaction.store.name}</Badge>
                                        </TableCell>
                                        <TableCell>{transaction.user.name}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {transaction.sales_items.map((item, index) => (
                                                    <div key={index} className="text-xs">
                                                        {item.product.name} ({item.quantity}x)
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(transaction.total_amount)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data transaksi
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            </div>
        </AppLayout>
    );
}
