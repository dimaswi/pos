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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Filter } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface CategoryData {
    id: number;
    name: string;
}

interface SupplierData {
    id: number;
    name: string;
}

interface ProductData {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    category_id: number;
    supplier_id?: number;
    unit: string;
    purchase_price: number;
    selling_price: number;
    minimum_price?: number;
    weight?: number;
    minimum_stock: number;
    is_track_stock: boolean;
    is_active: boolean;
    category: CategoryData;
    supplier?: SupplierData;
    created_at: string;
}

interface PaginatedProducts {
    data: ProductData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    products: PaginatedProducts;
    categories: CategoryData[];
    suppliers: SupplierData[];
    filters?: {
        search: string;
        category_id: string;
        supplier_id: string;
        is_active: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Data',
        href: '/master-data',
    },
    {
        title: 'Produk',
        href: '/master-data/products',
    },
];

export default function ProductIndex() {
    const { products, categories, suppliers, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [categoryId, setCategoryId] = useState(initialFilters?.category_id || 'all');
    const [supplierId, setSupplierId] = useState(initialFilters?.supplier_id || 'all');
    const [isActive, setIsActive] = useState(initialFilters?.is_active || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        product: ProductData | null;
        loading: boolean;
    }>({
        open: false,
        product: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const categoryOptions = [
        { value: 'all', label: 'Semua Kategori' },
        ...categories.map(category => ({
            value: category.id.toString(),
            label: category.name
        }))
    ];

    const supplierOptions = [
        { value: 'all', label: 'Semua Supplier' },
        ...suppliers.map(supplier => ({
            value: supplier.id.toString(),
            label: supplier.name
        }))
    ];

    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: '1', label: 'Aktif' },
        { value: '0', label: 'Tidak Aktif' }
    ];

    const handleSearch = (value: string) => {
        router.get('/master-data/products', {
            search: value,
            category_id: categoryId === 'all' ? '' : categoryId,
            supplier_id: supplierId === 'all' ? '' : supplierId,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/master-data/products', {
            search: search,
            category_id: categoryId === 'all' ? '' : categoryId,
            supplier_id: supplierId === 'all' ? '' : supplierId,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategoryId('all');
        setSupplierId('all');
        setIsActive('all');
        router.get('/master-data/products', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (product: ProductData) => {
        setDeleteDialog({
            open: true,
            product: product,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.product) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('master-data.products.destroy', deleteDialog.product.id), {
                onSuccess: () => {
                    toast.success('Produk berhasil dihapus');
                    setDeleteDialog({
                        open: false,
                        product: null,
                        loading: false,
                    });
                },
                onError: () => {
                    toast.error('Gagal menghapus produk');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Gagal menghapus produk');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({
            open: false,
            product: null,
            loading: false,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk" />
            
            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle>Produk</CardTitle>
                    <CardDescription>
                        Kelola data produk toko
                    </CardDescription>
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
                                    placeholder="Cari produk..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 md:w-[300px] md:flex-none"
                                />
                                <Button type="submit" size="sm" className="flex items-center gap-2 shrink-0">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cari</span>
                                </Button>
                            </form>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filter</span>
                                </Button>
                                <PermissionGate permission="product.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex items-center gap-2 hover:bg-green-200 flex-1 sm:flex-none justify-center"
                                        onClick={() => router.visit('/master-data/products/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        <span className="hidden sm:inline">Tambah Produk</span>
                                        <span className="sm:hidden">Tambah</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Produk</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                            <label className="text-sm font-medium mb-2 block">Supplier</label>
                                            <SearchableSelect
                                                value={supplierId}
                                                onValueChange={setSupplierId}
                                                options={supplierOptions}
                                                placeholder="Pilih supplier"
                                                emptyText="Supplier tidak ditemukan"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Status</label>
                                            <SearchableSelect
                                                value={isActive}
                                                onValueChange={setIsActive}
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
                                    <TableHead>Nama</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Harga Jual</TableHead>
                                    <TableHead>Stok Min</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.length > 0 ? (
                                    products.data.map((product: ProductData, index: number) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                {(products.current_page - 1) * products.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                            <TableCell>{product.category.name}</TableCell>
                                            <TableCell>{formatCurrency(product.selling_price)}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.minimum_stock <= 10 ? 'destructive' : 'default'}>
                                                    Min: {product.minimum_stock}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                                    {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <PermissionGate permission="product.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/master-data/products/${product.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="product.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/master-data/products/${product.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="product.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(product)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data produk yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <PermissionGate permission="product.delete">
                <Dialog open={deleteDialog.open} onOpenChange={handleDeleteCancel}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus produk "{deleteDialog.product?.name}"? 
                                Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={handleDeleteCancel}
                                disabled={deleteDialog.loading}
                            >
                                Batal
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleDeleteConfirm}
                                disabled={deleteDialog.loading}
                            >
                                {deleteDialog.loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    'Hapus'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PermissionGate>
        </AppLayout>
    );
}
