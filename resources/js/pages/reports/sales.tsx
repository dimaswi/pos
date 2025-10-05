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
                    <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Penjualan
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(summary.totalSales)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Revenue total periode ini</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Transaksi
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatNumber(summary.totalTransactions)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Jumlah transaksi</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Rata-rata Transaksi
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(summary.averageTransaction)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Nilai rata-rata per transaksi</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Item
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatNumber(summary.totalItems)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Jumlah item terjual</span>
                        </div>
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
                                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                                    <div>
                                        <p className="font-medium text-foreground">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{formatNumber(product.total_quantity)} unit</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">{formatCurrency(product.total_revenue)}</p>
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
                                <div key={date} className="flex justify-between items-center p-2 rounded border bg-muted/20">
                                    <span className="text-sm font-medium text-foreground">{date}</span>
                                    <span className="font-bold text-foreground">{formatCurrency(amount)}</span>
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
