import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown,
    Calculator,
    Download,
    Filter,
    PieChart,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PermissionGate from '@/components/permission-gate';

interface Store {
    id: number;
    name: string;
    code: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Summary {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    totalTransactions: number;
}

interface PaymentSummary {
    method: string;
    total_amount: number;
    transaction_count: number;
    percentage: number;
}

interface DailySummary {
    date: string;
    revenue: number;
    cogs: number;
    profit: number;
    transactions: number;
}

interface CategoryPerformance {
    category_name: string;
    revenue: number;
    quantity_sold: number;
    profit: number;
    profit_margin: number;
}

interface DiscountSummary {
    total_discount_amount: number;
    total_customer_discount: number;
    total_additional_discount: number;
    total_all_discounts: number;
    average_discount_percentage: number;
    transactions_with_discount: number;
}

interface DiscountBreakdown {
    type: string;
    total_amount: number;
    transaction_count: number;
    percentage_of_revenue: number;
}

interface Props {
    stores: Store[];
    paymentMethods: PaymentMethod[];
    summary: Summary;
    paymentSummary: PaymentSummary[];
    dailySummary: DailySummary[];
    categoryPerformance: CategoryPerformance[];
    discountSummary: DiscountSummary;
    discountBreakdown: DiscountBreakdown[];
    filters: {
        store_id?: string;
        start_date: string;
        end_date: string;
        group_by: string;
    };
}

export default function FinancialReport({ 
    stores, 
    paymentMethods, 
    summary, 
    paymentSummary, 
    dailySummary, 
    categoryPerformance, 
    discountSummary,
    discountBreakdown,
    filters 
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get(route('reports.financial'), localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const exportReport = (format: string) => {
        router.post(route('reports.export'), {
            type: 'financial',
            format,
            ...localFilters
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercentage = (percentage: number) => {
        return `${percentage.toFixed(2)}%`;
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
            <Head title="Laporan Keuangan" />

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
                                    router.get(route('reports.financial'));
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
                                        Total Pendapatan
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(summary.totalRevenue)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">{summary.totalTransactions} transaksi</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        HPP (COGS)
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(summary.totalCOGS)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Harga Pokok Penjualan</span>
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
                                        Laba Kotor
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(summary.grossProfit)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Pendapatan - HPP</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <PieChart className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Margin Keuntungan
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatPercentage(summary.profitMargin)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Persentase keuntungan</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Discount Summary */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Ringkasan Diskon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center p-4 bg-muted/30 rounded-lg border">
                            <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(discountSummary.total_all_discounts)}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Semua Diskon</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg border">
                            <div className="text-2xl font-bold text-foreground">
                                {formatPercentage(discountSummary.average_discount_percentage)}
                            </div>
                            <p className="text-sm text-muted-foreground">Rata-rata Persentase Diskon</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg border">
                            <div className="text-2xl font-bold text-foreground">
                                {discountSummary.transactions_with_discount}
                            </div>
                            <p className="text-sm text-muted-foreground">Transaksi dengan Diskon</p>
                        </div>
                    </div>
                    
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Jenis Diskon</TableHead>
                                    <TableHead className="text-right font-semibold">Total Amount</TableHead>
                                    <TableHead className="text-center font-semibold">Transaksi</TableHead>
                                    <TableHead className="text-right font-semibold">% dari Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discountBreakdown.map((discount, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{discount.type}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">
                                            {formatCurrency(discount.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">{discount.transaction_count}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary">
                                                {formatPercentage(discount.percentage_of_revenue)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Payment Methods Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Ringkasan Metode Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Metode Pembayaran</TableHead>
                                        <TableHead className="text-right font-semibold">Total Amount</TableHead>
                                        <TableHead className="text-center font-semibold">Transaksi</TableHead>
                                        <TableHead className="text-right font-semibold">Persentase</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentSummary.length > 0 ? paymentSummary.map((payment, index) => (
                                        <TableRow key={index} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">{payment.method}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(payment.total_amount)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{payment.transaction_count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="default">{formatPercentage(payment.percentage)}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data metode pembayaran
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Performa Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Kategori</TableHead>
                                        <TableHead className="text-right font-semibold">Pendapatan</TableHead>
                                        <TableHead className="text-right font-semibold">Qty</TableHead>
                                        <TableHead className="text-right font-semibold">Margin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryPerformance.length > 0 ? categoryPerformance.map((category, index) => (
                                        <TableRow key={index} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">{category.category_name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(category.revenue)}</TableCell>
                                            <TableCell className="text-right">{category.quantity_sold}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={category.profit_margin > 20 ? 'default' : 'secondary'}>
                                                    {formatPercentage(category.profit_margin)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data kategori
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Ringkasan {filters.group_by === 'day' ? 'Harian' : filters.group_by === 'week' ? 'Mingguan' : 'Bulanan'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Tanggal</TableHead>
                                    <TableHead className="text-right font-semibold">Pendapatan</TableHead>
                                    <TableHead className="text-right font-semibold">HPP</TableHead>
                                    <TableHead className="text-right font-semibold">Laba</TableHead>
                                    <TableHead className="text-right font-semibold">Transaksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailySummary.length > 0 ? dailySummary.map((day, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{day.date}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(day.revenue)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(day.cogs)}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={day.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(day.profit)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">{day.transactions}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data ringkasan
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