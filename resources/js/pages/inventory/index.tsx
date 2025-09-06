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
import { Edit3, Search, Filter, X, Eye, Package, AlertTriangle, CheckCircle, Package2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

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
    code: string;
    barcode: string;
    category: CategoryData;
}

interface InventoryData {
    id: number;
    store_id: number;
    product_id: number;
    quantity: number;
    minimum_stock: number;
    maximum_stock: number | null;
    average_cost: number;
    last_cost: number;
    location: string | null;
    last_restock_date: string | null;
    stock_status: string;
    stock_value: number;
    store: StoreData;
    product: ProductData;
}

interface PaginatedInventories {
    data: InventoryData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    inventories: PaginatedInventories;
    stores: StoreData[];
    categories: CategoryData[];
    filters?: {
        search: string;
        store_id: string;
        category_id: string;
        stock_status: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris',
        href: '/inventory',
    },
    {
        title: 'Stok',
        href: '/inventory',
    },
];

export default function InventoryIndex() {
    const { inventories, stores, categories, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');
    const [categoryId, setCategoryId] = useState(initialFilters?.category_id || 'all');
    const [stockStatus, setStockStatus] = useState(initialFilters?.stock_status || 'all');
    const [showFilters, setShowFilters] = useState(false);

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
        { value: 'in_stock', label: 'Stok Normal' },
        { value: 'low_stock', label: 'Stok Menipis' },
        { value: 'out_of_stock', label: 'Stok Habis' }
    ];

    const handleSearch = (value: string) => {
        router.get('/inventory', {
            search: value,
            store_id: storeId === 'all' ? '' : storeId,
            category_id: categoryId === 'all' ? '' : categoryId,
            stock_status: stockStatus === 'all' ? '' : stockStatus,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/inventory', {
            search: search,
            store_id: storeId === 'all' ? '' : storeId,
            category_id: categoryId === 'all' ? '' : categoryId,
            stock_status: stockStatus === 'all' ? '' : stockStatus,
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
        setStockStatus('all');
        router.get('/inventory', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getStockStatusBadge = (status: string, quantity: number) => {
        switch (status) {
            case 'out_of_stock':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Habis
                    </Badge>
                );
            case 'low_stock':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                        <Package className="h-3 w-3" />
                        Menipis ({quantity})
                    </Badge>
                );
            case 'in_stock':
                return (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Normal ({quantity})
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline">
                        {quantity}
                    </Badge>
                );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const calculateStockValue = (inventory: InventoryData) => {
        return inventory.quantity * inventory.average_cost;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventaris - Stok" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package2 className="h-5 w-5" />
                        Inventaris Stok
                    </CardTitle>
                    <CardDescription>
                        Kelola stok produk di setiap toko dengan monitoring real-time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Filter Section */}
                        <div className="flex items-center justify-between gap-4">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSearch(search);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    type="text"
                                    placeholder="Cari produk atau toko..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-[300px]"
                                />
                                <Button type="submit" size="sm" className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Cari
                                </Button>
                            </form>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-2"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-2 hover:bg-yellow-50"
                                    onClick={() => router.visit('/inventory/low-stock')}
                                >
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    Stok Menipis
                                </Button>
                                <PermissionGate permission="inventory.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex items-center gap-2 hover:bg-green-50"
                                        onClick={() => router.visit('/inventory/create')}
                                    >
                                        <Package className="h-4 w-4 text-green-500" />
                                        Tambah Produk
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Inventaris</CardTitle>
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
                                            <label className="text-sm font-medium mb-2 block">Status Stok</label>
                                            <SearchableSelect
                                                value={stockStatus}
                                                onValueChange={setStockStatus}
                                                options={stockStatusOptions}
                                                placeholder="Pilih status stok"
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
                                    <TableHead className="text-center">Stok</TableHead>
                                    <TableHead className="text-center">Min. Stok</TableHead>
                                    <TableHead className="text-right">
                                        <div className="text-right">
                                            <div>Nilai Stok</div>
                                            <div className="text-xs text-muted-foreground font-normal">Total • @Harga Rata-rata</div>
                                        </div>
                                    </TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventories.data.length > 0 ? (
                                    inventories.data.map((inventory, index) => (
                                        <TableRow key={inventory.id}>
                                            <TableCell>{(inventories.current_page - 1) * inventories.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{inventory.product.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {inventory.product.code} • {inventory.product.barcode}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{inventory.store.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{inventory.product.category.name}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStockStatusBadge(inventory.stock_status, inventory.quantity)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm">{inventory.minimum_stock}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-semibold">
                                                        {formatCurrency(calculateStockValue(inventory))}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        @{formatCurrency(inventory.average_cost)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{inventory.location || '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <PermissionGate permission="inventory.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/inventory/show/${inventory.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="inventory.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/inventory/edit/${inventory.id}`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data inventaris yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {inventories.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {((inventories.current_page - 1) * inventories.per_page) + 1} - {Math.min(inventories.current_page * inventories.per_page, inventories.total)} dari {inventories.total} data
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={inventories.current_page === 1}
                                    onClick={() => router.visit(`/inventory?page=${inventories.current_page - 1}`)}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={inventories.current_page === inventories.last_page}
                                    onClick={() => router.visit(`/inventory?page=${inventories.current_page + 1}`)}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
