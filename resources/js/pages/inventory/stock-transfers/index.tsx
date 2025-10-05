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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Filter, ArrowRightLeft, Package } from 'lucide-react';
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

interface UserData {
    id: number;
    name: string;
}

interface StockTransferData {
    id: number;
    transfer_number: string;
    from_store_id: number;
    to_store_id: number;
    transfer_date: string;
    status: string;
    total_value: number;
    notes: string | null;
    from_store: StoreData;
    to_store: StoreData;
    created_by_user: UserData;
    approved_by_user?: UserData;
    items_count: number;
}

interface PaginatedStockTransfers {
    data: StockTransferData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    transfers: PaginatedStockTransfers;
    stores: StoreData[];
    filters?: {
        search: string;
        from_store_id: string;
        to_store_id: string;
        status: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'Stock Transfers', href: '/inventory/stock-transfers' },
];

export default function StockTransferIndex() {
    const { transfers, stores, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [fromStoreId, setFromStoreId] = useState(initialFilters?.from_store_id || 'all');
    const [toStoreId, setToStoreId] = useState(initialFilters?.to_store_id || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        transfer: StockTransferData | null;
        loading: boolean;
    }>({
        open: false,
        transfer: null,
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

    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const handleSearch = (value: string) => {
        router.get('/inventory/stock-transfers', {
            search: value,
            from_store_id: fromStoreId === 'all' ? '' : fromStoreId,
            to_store_id: toStoreId === 'all' ? '' : toStoreId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/inventory/stock-transfers', {
            search: search,
            from_store_id: fromStoreId === 'all' ? '' : fromStoreId,
            to_store_id: toStoreId === 'all' ? '' : toStoreId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setFromStoreId('all');
        setToStoreId('all');
        setStatus('all');
        router.get('/inventory/stock-transfers', {
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
                return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'in_transit':
                return <Badge variant="default" className="bg-blue-100 text-blue-800">In Transit</Badge>;
            case 'completed':
                return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
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

    const handleDeleteClick = (transfer: StockTransferData) => {
        setDeleteDialog({
            open: true,
            transfer: transfer,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.transfer) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('inventory.stock-transfers.destroy', deleteDialog.transfer.id), {
                onSuccess: () => {
                    toast.success(`Stock Transfer ${deleteDialog.transfer?.transfer_number} berhasil dihapus`);
                    setDeleteDialog({
                        open: false,
                        transfer: null,
                        loading: false,
                    });
                },
                onError: () => {
                    toast.error('Gagal menghapus stock transfer');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus stock transfer');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, transfer: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Transfers" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Stock Transfers
                    </CardTitle>
                    <CardDescription>
                        Kelola transfer stok antar toko untuk distribusi yang efisien
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
                                    placeholder="Cari transfer number, catatan..."
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
                                <PermissionGate permission="stock-transfer.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 hover:bg-green-50"
                                        onClick={() => router.visit('/inventory/stock-transfers/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        <span className="hidden sm:inline">Buat Transfer</span>
                                        <span className="sm:hidden">Buat</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Stock Transfers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Dari Toko</label>
                                            <SearchableSelect
                                                value={fromStoreId}
                                                onValueChange={setFromStoreId}
                                                options={storeOptions}
                                                placeholder="Pilih toko asal"
                                                emptyText="Toko tidak ditemukan"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Ke Toko</label>
                                            <SearchableSelect
                                                value={toStoreId}
                                                onValueChange={setToStoreId}
                                                options={storeOptions}
                                                placeholder="Pilih toko tujuan"
                                                emptyText="Toko tidak ditemukan"
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
                                    <TableHead>Transfer Number</TableHead>
                                    <TableHead>Dari Toko</TableHead>
                                    <TableHead>Ke Toko</TableHead>
                                    <TableHead>Tanggal Transfer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Total Value</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead className="w-[120px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfers.data.length > 0 ? (
                                    transfers.data.map((transfer, index) => (
                                        <TableRow key={transfer.id}>
                                            <TableCell>{(transfers.current_page - 1) * transfers.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{transfer.transfer_number}</p>
                                                    {transfer.notes && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {transfer.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium">{transfer.from_store?.name || 'Unknown Store'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-green-500" />
                                                    <span className="font-medium">{transfer.to_store?.name || 'Unknown Store'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(transfer.transfer_date).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(transfer.status)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium">{transfer.items_count} item(s)</span>
                                            </TableCell>
                                            <TableCell className="font-medium text-blue-600">
                                                {formatCurrency(transfer.total_value)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{transfer.created_by_user?.name || 'Unknown'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <PermissionGate permission="stock-transfer.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/inventory/stock-transfers/${transfer.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="stock-transfer.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/inventory/stock-transfers/${transfer.id}/edit`)}
                                                            disabled={transfer.status === 'completed' || transfer.status === 'cancelled'}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="stock-transfer.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(transfer)}
                                                            disabled={transfer.status === 'completed'}
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
                                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                                                <p>Tidak ada stock transfer yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {transfers.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {(transfers.current_page - 1) * transfers.per_page + 1} - {Math.min(transfers.current_page * transfers.per_page, transfers.total)} dari {transfers.total} stock transfers
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={transfers.current_page === 1}
                                    onClick={() => router.visit(`/inventory/stock-transfers?page=${transfers.current_page - 1}`)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={transfers.current_page === transfers.last_page}
                                    onClick={() => router.visit(`/inventory/stock-transfers?page=${transfers.current_page + 1}`)}
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
                            Apakah Anda yakin ingin menghapus Stock Transfer "{deleteDialog.transfer?.transfer_number}"? 
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
