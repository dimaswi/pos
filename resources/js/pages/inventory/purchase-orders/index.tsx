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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Filter, ShoppingCart, FileText } from 'lucide-react';
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

interface SupplierData {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
}

interface PurchaseOrderData {
    id: number;
    po_number: string;
    store_id: number;
    supplier_id: number;
    created_by: number;
    order_date: string;
    expected_date: string | null;
    received_date: string | null;
    status: string;
    subtotal: number;
    tax_amount: number;
    shipping_cost: number;
    discount_amount: number;
    total_amount: number;
    notes: string | null;
    store: StoreData;
    supplier: SupplierData;
    created_by_user: UserData;
    items_count: number;
    progress_percentage: number;
}

interface PaginatedPurchaseOrders {
    data: PurchaseOrderData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    purchaseOrders: PaginatedPurchaseOrders;
    stores: StoreData[];
    suppliers: SupplierData[];
    filters?: {
        search: string;
        store_id: string;
        supplier_id: string;
        status: string;
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
        title: 'Purchase Orders',
        href: '/inventory/purchase-orders',
    },
];

export default function PurchaseOrderIndex() {
    const { purchaseOrders, stores, suppliers, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');
    const [supplierId, setSupplierId] = useState(initialFilters?.supplier_id || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        purchaseOrder: PurchaseOrderData | null;
        loading: boolean;
    }>({
        open: false,
        purchaseOrder: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const storeOptions = [
        { value: 'all', label: 'Semua Toko' },
        ...stores.map(store => ({
            value: store.id.toString(),
            label: store.name
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
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'ordered', label: 'Ordered' },
        { value: 'partial_received', label: 'Partial Received' },
        { value: 'received', label: 'Received' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const handleSearch = (value: string) => {
        router.get('/inventory/purchase-orders', {
            search: value,
            store_id: storeId === 'all' ? '' : storeId,
            supplier_id: supplierId === 'all' ? '' : supplierId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/inventory/purchase-orders', {
            search: search,
            store_id: storeId === 'all' ? '' : storeId,
            supplier_id: supplierId === 'all' ? '' : supplierId,
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
        setSupplierId('all');
        setStatus('all');
        router.get('/inventory/purchase-orders', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="outline">Draft</Badge>;
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            case 'approved':
                return <Badge variant="default" className="bg-blue-100 text-blue-800">Approved</Badge>;
            case 'ordered':
                return <Badge variant="default" className="bg-purple-100 text-purple-800">Ordered</Badge>;
            case 'partial_received':
                return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Partial Received</Badge>;
            case 'received':
                return <Badge variant="default" className="bg-green-100 text-green-800">Received</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
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

    const handleDeleteClick = (purchaseOrder: PurchaseOrderData) => {
        setDeleteDialog({
            open: true,
            purchaseOrder: purchaseOrder,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.purchaseOrder) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('inventory.purchase-orders.destroy', deleteDialog.purchaseOrder.id), {
                onSuccess: () => {
                    toast.success(`Purchase Order ${deleteDialog.purchaseOrder?.po_number} berhasil dihapus`);
                    setDeleteDialog({
                        open: false,
                        purchaseOrder: null,
                        loading: false,
                    });
                },
                onError: () => {
                    toast.error('Gagal menghapus purchase order');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus purchase order');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, purchaseOrder: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Purchase Orders
                    </CardTitle>
                    <CardDescription>
                        Kelola pesanan pembelian dari supplier untuk restok inventaris
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
                                    placeholder="Cari PO number, supplier..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 md:w-[300px] md:flex-none"
                                />
                                <Button type="submit" size="sm" className="shrink-0 flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cari</span>
                                </Button>
                            </form>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filter</span>
                                </Button>
                                <PermissionGate permission="purchase-order.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 hover:bg-green-50"
                                        onClick={() => router.visit('/inventory/purchase-orders/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        <span className="hidden sm:inline">Buat PO</span>
                                        <span className="sm:hidden">Buat</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Purchase Orders</CardTitle>
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
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Toko</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tanggal Order</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="w-[120px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.data.length > 0 ? (
                                    purchaseOrders.data.map((po, index) => (
                                        <TableRow key={po.id}>
                                            <TableCell>{(purchaseOrders.current_page - 1) * purchaseOrders.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{po.po_number}</p>
                                                    <p className="text-sm text-muted-foreground">{po.items_count || 0} item(s)</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{po.store.name}</TableCell>
                                            <TableCell>{po.supplier.name}</TableCell>
                                            <TableCell>
                                                {new Date(po.order_date).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(po.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${po.progress_percentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {Math.round(po.progress_percentage || 0)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(po.total_amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <PermissionGate permission="purchase-order.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/inventory/purchase-orders/${po.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="purchase-order.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/inventory/purchase-orders/${po.id}/edit`)}
                                                            disabled={!['draft', 'pending'].includes(po.status)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="purchase-order.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(po)}
                                                            disabled={!['draft', 'pending'].includes(po.status)}
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
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <p>Tidak ada purchase order yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {purchaseOrders.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {(purchaseOrders.current_page - 1) * purchaseOrders.per_page + 1} - {Math.min(purchaseOrders.current_page * purchaseOrders.per_page, purchaseOrders.total)} dari {purchaseOrders.total} purchase orders
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={purchaseOrders.current_page === 1}
                                    onClick={() => router.visit(`/inventory/purchase-orders?page=${purchaseOrders.current_page - 1}`)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={purchaseOrders.current_page === purchaseOrders.last_page}
                                    onClick={() => router.visit(`/inventory/purchase-orders?page=${purchaseOrders.current_page + 1}`)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={handleDeleteCancel}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus Purchase Order "{deleteDialog.purchaseOrder?.po_number}"? 
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
        </AppLayout>
    );
}
