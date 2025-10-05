import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, X, AlertTriangle, Package, TrendingDown, RefreshCw, ShoppingCart } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoreData {
    id: number;
    name: string;
}

interface CategoryData {
    id: number;
    name: string;
}

interface ProductData {
    id: number;
    name: string;
    sku: string;
    category: CategoryData;
    price: number;
    purchase_price?: number;
    selling_price?: number;
}

interface StockAlertData {
    id: number;
    store_id: number;
    product_id: number;
    current_stock: number;
    minimum_stock: number;
    stock_difference: number;
    shortage: number;
    status: string;
    alert_level: string;
    alert_text: string;
    alert_color: string;
    estimated_value: number;
    last_updated: string;
    store: StoreData;
    product: ProductData;
}

interface PaginatedStockAlerts {
    data: StockAlertData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    critical_count: number;
    warning_count: number;
    low_count: number;
}

interface Props {
    alerts: PaginatedStockAlerts;
    stores: StoreData[];
    categories: CategoryData[];
    filters?: {
        search: string;
        store_id: string;
        category_id: string;
        status: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'Stock Alerts', href: '/inventory/stock-alerts' },
];

export default function StockAlertIndex() {
    const { alerts, stores, categories, filters: initialFilters } = usePage<Props>().props;
    
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');
    const [categoryId, setCategoryId] = useState(initialFilters?.category_id || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reorderDialog, setReorderDialog] = useState<{
        open: boolean;
        alert: StockAlertData | null;
    }>({
        open: false,
        alert: null,
    });

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

    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'critical', label: 'Critical (Stok Habis)' },
        { value: 'warning', label: 'Warning (Sangat Rendah)' },
        { value: 'low', label: 'Low (Rendah)' }
    ];

    const handleSearch = (value: string) => {
        router.get('/inventory/alerts/stock-alerts', {
            search: value,
            store_id: storeId === 'all' ? '' : storeId,
            category_id: categoryId === 'all' ? '' : categoryId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/inventory/alerts/stock-alerts', {
            search: search,
            store_id: storeId === 'all' ? '' : storeId,
            category_id: categoryId === 'all' ? '' : categoryId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStoreId('all');
        setCategoryId('all');
        setStatus('all');
        router.get('/inventory/alerts/stock-alerts', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await router.reload({
                onSuccess: () => {
                    toast.success('Data stock alerts berhasil diperbarui');
                },
                onError: () => {
                    toast.error('Gagal memperbarui data stock alerts');
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat memperbarui data');
        } finally {
            setIsRefreshing(false);
        }
    };

    const getStatusBadge = (status: string, stockDifference: number) => {
        switch (status) {
            case 'critical':
                return <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Critical
                </Badge>;
            case 'warning':
                return <Badge variant="default" className="bg-orange-100 text-orange-800 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Warning
                </Badge>;
            case 'low':
                return <Badge variant="default" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Low
                </Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityColor = (status: string) => {
        switch (status) {
            case 'critical': return 'border-l-red-500 bg-red-50';
            case 'warning': return 'border-l-orange-500 bg-orange-50';
            case 'low': return 'border-l-yellow-500 bg-yellow-50';
            default: return 'border-l-gray-300';
        }
    };

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return 'Rp 0';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDateTime = (dateString: string | undefined | null) => {
        if (!dateString) {
            return 'Invalid Date';
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const handleCreatePurchaseOrder = (alert: StockAlertData) => {
        router.visit(`/inventory/purchase-orders/create?product_id=${alert.product_id}&store_id=${alert.store_id}&suggested_quantity=${Math.abs(alert.stock_difference)}`);
    };

    const handleReorderClick = (alert: StockAlertData) => {
        setReorderDialog({
            open: true,
            alert: alert,
        });
    };

    const handleReorderClose = () => {
        setReorderDialog({ open: false, alert: null });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Alerts" />

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                                <p className="text-2xl font-bold">{alerts.total}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-700">Critical</p>
                                <p className="text-2xl font-bold text-red-600">{alerts.critical_count}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-orange-700">Warning</p>
                                <p className="text-2xl font-bold text-orange-600">{alerts.warning_count}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-700">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-600">{alerts.low_count}</p>
                            </div>
                            <Package className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Stock Alerts
                            </CardTitle>
                            <CardDescription>
                                Monitor stok produk yang mencapai batas minimum per toko
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Filter Section */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSearch(search);
                                }}
                                className="flex flex-1 items-center gap-2"
                            >
                                <Input
                                    type="text"
                                    placeholder="Cari produk, SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 md:w-[300px] md:flex-none"
                                />
                                <Button type="submit" size="sm" className="shrink-0 flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cari</span>
                                </Button>
                            </form>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-2 justify-center"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filter</span>
                            </Button>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Stock Alerts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Toko</label>
                                            <SearchableSelect
                                                value={storeId}
                                                onValueChange={setStoreId}
                                                options={storeOptions}
                                                placeholder="Pilih toko"
                                                emptyText="Toko tidak ditemukan"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Kategori</label>
                                            <SearchableSelect
                                                value={categoryId}
                                                onValueChange={setCategoryId}
                                                options={categoryOptions}
                                                placeholder="Pilih kategori"
                                                emptyText="Kategori tidak ditemukan"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Status</label>
                                            <SearchableSelect
                                                value={status}
                                                onValueChange={setStatus}
                                                options={statusOptions}
                                                placeholder="Pilih status"
                                                emptyText="Status tidak ditemukan"
                                            />
                                        </div>
                                        
                                        <div className="flex items-end gap-2">
                                            <Button 
                                                onClick={handleFilter} 
                                                className="flex items-center gap-2"
                                            >
                                                <Filter className="h-4 w-4" />
                                                Terapkan
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-2"
                                            >
                                                <X className="h-4 w-4" />
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    <div className="mt-6 w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Toko</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Current Stock</TableHead>
                                    <TableHead>Minimum Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Shortfall</TableHead>
                                    <TableHead>Est. Value</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="w-[120px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.data.length > 0 ? (
                                    alerts.data.map((alert, index) => (
                                        <TableRow key={alert.id} className={`border-l-4 ${getPriorityColor(alert.status)}`}>
                                            <TableCell>{(alerts.current_page - 1) * alerts.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{alert.product?.name || 'Unknown Product'}</p>
                                                    <p className="text-sm text-muted-foreground font-mono">
                                                        {alert.product?.sku || '-'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{alert.store?.name || 'Unknown Store'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{alert.product?.category?.name || '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-medium ${alert.current_stock === 0 ? 'text-red-600' : alert.current_stock <= alert.minimum_stock ? 'text-orange-600' : ''}`}>
                                                    {alert.current_stock}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{alert.minimum_stock}</span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(alert.status, alert.stock_difference)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-red-600">
                                                    {Math.abs(alert.stock_difference)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-blue-600">
                                                    {formatCurrency(alert.estimated_value || (Math.abs(alert.stock_difference) * (alert.product?.price || 0)))}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDateTime(alert.last_updated)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-600 hover:bg-green-50"
                                                        onClick={() => handleCreatePurchaseOrder(alert)}
                                                        title="Buat Purchase Order"
                                                    >
                                                        <ShoppingCart className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                                                <p>Tidak ada stock alert yang ditemukan.</p>
                                                <p className="text-sm">Semua stok dalam kondisi baik!</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {alerts.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {(alerts.current_page - 1) * alerts.per_page + 1} - {Math.min(alerts.current_page * alerts.per_page, alerts.total)} dari {alerts.total} stock alerts
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={alerts.current_page === 1}
                                    onClick={() => router.visit(`/inventory/stock-alerts?page=${alerts.current_page - 1}`)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={alerts.current_page === alerts.last_page}
                                    onClick={() => router.visit(`/inventory/stock-alerts?page=${alerts.current_page + 1}`)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reorder Confirmation Dialog */}
            <Dialog open={reorderDialog.open} onOpenChange={handleReorderClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buat Purchase Order</DialogTitle>
                        <DialogDescription>
                            Apakah Anda ingin membuat Purchase Order untuk produk "{reorderDialog.alert?.product?.name}" 
                            di toko "{reorderDialog.alert?.store?.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    {reorderDialog.alert && (
                        <div className="space-y-2 p-4 bg-muted rounded-lg">
                            <div className="flex justify-between">
                                <span>Current Stock:</span>
                                <span className="font-medium">{reorderDialog.alert.current_stock}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Minimum Stock:</span>
                                <span className="font-medium">{reorderDialog.alert.minimum_stock}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Suggested Quantity:</span>
                                <span className="font-medium text-blue-600">{Math.abs(reorderDialog.alert.stock_difference)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estimated Value:</span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(reorderDialog.alert.estimated_value || (Math.abs(reorderDialog.alert.stock_difference) * (reorderDialog.alert.product?.price || 0)))}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={handleReorderClose}>
                            Batal
                        </Button>
                        <Button 
                            onClick={() => {
                                if (reorderDialog.alert) {
                                    handleCreatePurchaseOrder(reorderDialog.alert);
                                    handleReorderClose();
                                }
                            }}
                        >
                            Buat Purchase Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
