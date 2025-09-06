import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { 
    Package, 
    AlertTriangle, 
    TrendingDown,
    DollarSign,
    Download,
    Filter,
    Eye,
    Info
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PermissionGate from '@/components/permission-gate';

// Currency formatting utility
const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Number formatting utility
const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }
    return new Intl.NumberFormat('id-ID').format(num);
};

interface Store {
    id: number;
    name: string;
    code: string;
}

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    selling_price: number;
    category: Category;
    inventories: Array<{
        store: Store;
        quantity: number;
        minimum_stock: number;
        average_cost: number;
        stock_value?: number; // Make optional since it might be calculated
        potential_revenue?: number; // Potential selling value
        stock_status: string;
    }>;
}

interface Summary {
    totalProducts: number;
    totalStockValue: number;
    totalPotentialRevenue: number;
    lowStockCount: number;
    outOfStockCount: number;
}

interface StockMovement {
    product_name: string;
    store_name: string;
    movement_type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    movement_date: string;
    created_at: string;
    reference_type?: string;
    reference_id?: number;
}

interface Props {
    stores: Store[];
    categories: Category[];
    products: Product[];
    summary: Summary;
    stockMovements: StockMovement[];
    filters: {
        store_id?: string;
        category_id?: string;
        stock_status?: string;
        search?: string;
    };
}

export default function InventoryReport({ stores, categories, products, summary, stockMovements, filters }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get(route('reports.inventory'), localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const exportReport = (format: string) => {
        router.post(route('reports.export'), {
            type: 'inventory',
            format,
            ...localFilters
        });
    };

    // Prepare options for searchable selects
    const storeOptions = [
        { value: 'all', label: 'Semua Toko' },
        ...stores.map(store => ({
            value: store.id.toString(),
            label: store.name
        }))
    ];

    const categoryOptions = [
        { value: 'all', label: 'Semua Kategori' },
        ...categories.map(category => ({
            value: category.id.toString(),
            label: category.name
        }))
    ];

    const stockStatusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'out_of_stock', label: 'Habis' },
        { value: 'low_stock', label: 'Stok Rendah' },
        { value: 'normal', label: 'Normal' }
    ];

    const getStockStatus = (quantity: number, minimumStock: number) => {
        if (quantity === 0) {
            return <Badge variant="destructive">Habis</Badge>;
        } else if (quantity <= minimumStock) {
            return <Badge variant="secondary">Stok Rendah</Badge>;
        } else {
            return <Badge variant="default">Normal</Badge>;
        }
    };

    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'in':
            case 'purchase':
                return 'text-green-600';
            case 'out':
            case 'sale':
                return 'text-red-600';
            case 'adjustment':
                return 'text-blue-600';
            case 'transfer':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <AppLayout>
            <Head title="Laporan Inventory" />

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
                                    value={localFilters.store_id || 'all'}
                                    onValueChange={(value) => handleFilterChange('store_id', value === 'all' ? '' : value)}
                                    options={storeOptions}
                                    placeholder="Pilih toko..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Kategori</label>
                                <SearchableSelect
                                    value={localFilters.category_id || 'all'}
                                    onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? '' : value)}
                                    options={categoryOptions}
                                    placeholder="Pilih kategori..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Status Stok</label>
                                <SearchableSelect
                                    value={localFilters.stock_status || 'all'}
                                    onValueChange={(value) => handleFilterChange('stock_status', value === 'all' ? '' : value)}
                                    options={stockStatusOptions}
                                    placeholder="Pilih status..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Cari Produk</label>
                                <Input
                                    placeholder="Nama atau SKU produk"
                                    value={localFilters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
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
                                    setLocalFilters({});
                                    router.get(route('reports.inventory'));
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
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{formatNumber(summary.totalProducts)}</div>
                            <p className="text-xs text-muted-foreground mt-1">produk tersedia</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nilai Modal Stok</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalStockValue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">modal tertanam</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Potensi Penjualan</CardTitle>
                            <DollarSign className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalPotentialRevenue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">jika semua terjual</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stok Kritis</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-lg font-bold text-yellow-600">{formatNumber(summary.lowStockCount)}</div>
                                    <p className="text-xs text-muted-foreground">perlu restok</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-red-600">{formatNumber(summary.outOfStockCount)}</div>
                                    <p className="text-xs text-muted-foreground">habis stok</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Daftar Produk & Stok
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Produk</TableHead>
                                        <TableHead className="font-semibold w-[120px]">SKU</TableHead>
                                        <TableHead className="font-semibold w-[150px]">Kategori</TableHead>
                                        <TableHead className="font-semibold">Stok</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right font-semibold w-[120px]">
                                            <div className="flex items-center justify-end gap-1">
                                                Nilai Modal
                                                <span title="Modal yang tertanam (qty × average cost)">
                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                </span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right font-semibold w-[120px]">
                                            <div className="flex items-center justify-end gap-1">
                                                Potensi Jual
                                                <span title="Nilai jika semua stok terjual (qty × selling price)">
                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                </span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center font-semibold w-[80px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.length > 0 ? products.map((product) => (
                                        <TableRow key={product.id} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.category.name}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {product.inventories.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {product.inventories.map((inv, index) => (
                                                            <div key={index} className="text-sm">
                                                                <span className="font-medium">{inv.store.name}:</span> {formatNumber(inv.quantity || 0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {product.inventories.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {product.inventories.map((inv, index) => (
                                                            <div key={index}>
                                                                {getStockStatus(inv.quantity || 0, inv.minimum_stock || 0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Badge variant="destructive">Tidak ada stok</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.inventories.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {product.inventories.map((inv, index) => {
                                                            // Use the stock_value from backend or calculate as fallback
                                                            const stockValue = inv.stock_value ?? 
                                                                             ((inv.quantity || 0) * (inv.average_cost || 0));
                                                            
                                                            return (
                                                                <div key={index} className="text-sm font-medium text-green-600">
                                                                    {formatCurrency(stockValue)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.inventories.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {product.inventories.map((inv, index) => {
                                                            // Calculate potential revenue (quantity × selling price)
                                                            const potentialRevenue = inv.potential_revenue ?? 
                                                                                    ((inv.quantity || 0) * (product.selling_price || 0));
                                                            
                                                            return (
                                                                <div key={index} className="text-sm font-medium text-purple-600">
                                                                    {formatCurrency(potentialRevenue)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <PermissionGate permission="product.view">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(`/master-data/products/${product.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </PermissionGate>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data produk
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Movements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Pergerakan Stok Terbaru
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Tanggal</TableHead>
                                        <TableHead className="font-semibold">Produk</TableHead>
                                        <TableHead className="font-semibold">Toko</TableHead>
                                        <TableHead className="font-semibold">Jenis</TableHead>
                                        <TableHead className="text-center font-semibold w-[100px]">Qty</TableHead>
                                        <TableHead className="text-center font-semibold w-[100px]">Stok</TableHead>
                                        <TableHead className="font-semibold">Referensi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockMovements.length > 0 ? stockMovements.map((movement, index) => (
                                        <TableRow key={index} className="hover:bg-muted/30">
                                            <TableCell className="text-sm">
                                                {new Date(movement.movement_date || movement.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="font-medium">{movement.product_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium">
                                                    {movement.store_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                                                    {movement.movement_type === 'in' ? 'Masuk' : 
                                                     movement.movement_type === 'out' ? 'Keluar' :
                                                     movement.movement_type === 'adjustment' ? 'Penyesuaian' :
                                                     movement.movement_type === 'transfer' ? 'Transfer' : 
                                                     movement.movement_type === 'sale' ? 'Penjualan' :
                                                     movement.movement_type === 'purchase' ? 'Pembelian' : movement.movement_type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                                                    {movement.movement_type === 'in' || movement.movement_type === 'purchase' ? '+' : '-'}{Math.abs(movement.quantity || 0)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {formatNumber(movement.quantity_before)} → {formatNumber(movement.quantity_after)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {movement.reference_type && movement.reference_id ? 
                                                    `${movement.reference_type} #${movement.reference_id}` : '-'}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                Tidak ada pergerakan stok
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
