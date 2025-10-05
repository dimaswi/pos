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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Filter, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
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

interface StockAdjustmentData {
    id: number;
    adjustment_number: string;
    store_id: number;
    type: string;
    reason: string;
    adjustment_date: string;
    status: string;
    total_value_impact: number;
    notes: string | null;
    store: StoreData;
    created_by: UserData;
    approved_by?: UserData;
    items_count: number;
    formatted_type: string;
    formatted_reason: string;
}

interface PaginatedStockAdjustments {
    data: StockAdjustmentData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    adjustments: PaginatedStockAdjustments;
    stores: StoreData[];
    filters?: {
        search: string;
        store_id: string;
        status: string;
        type: string;
        reason: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'Stock Adjustments', href: '/inventory/stock-adjustments' },
];

export default function StockAdjustmentIndex() {
    const { adjustments, stores, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [type, setType] = useState(initialFilters?.type || 'all');
    const [reason, setReason] = useState(initialFilters?.reason || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        adjustment: StockAdjustmentData | null;
        loading: boolean;
    }>({
        open: false,
        adjustment: null,
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
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
    ];

    const typeOptions = [
        { value: 'all', label: 'Semua Tipe' },
        { value: 'increase', label: 'Penambahan' },
        { value: 'decrease', label: 'Pengurangan' }
    ];

    const reasonOptions = [
        { value: 'all', label: 'Semua Alasan' },
        { value: 'damaged', label: 'Rusak' },
        { value: 'expired', label: 'Kadaluarsa' },
        { value: 'lost', label: 'Hilang' },
        { value: 'found', label: 'Ditemukan' },
        { value: 'correction', label: 'Koreksi' },
        { value: 'other', label: 'Lainnya' }
    ];

    const handleSearch = (value: string) => {
        router.get('/inventory/stock-adjustments', {
            search: value,
            store_id: storeId === 'all' ? '' : storeId,
            status: status === 'all' ? '' : status,
            type: type === 'all' ? '' : type,
            reason: reason === 'all' ? '' : reason,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/inventory/stock-adjustments', {
            search: search,
            store_id: storeId === 'all' ? '' : storeId,
            status: status === 'all' ? '' : status,
            type: type === 'all' ? '' : type,
            reason: reason === 'all' ? '' : reason,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStoreId('all');
        setStatus('all');
        setType('all');
        setReason('all');
        router.get('/inventory/stock-adjustments', {
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
            case 'approved':
                return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        return type === 'increase' ? (
            <Badge variant="default" className="bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                Penambahan
            </Badge>
        ) : (
            <Badge variant="default" className="bg-red-100 text-red-700">
                <TrendingDown className="h-3 w-3 mr-1" />
                Pengurangan
            </Badge>
        );
    };

    const formatCurrency = (amount: number | null | undefined) => {
        const value = amount || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleDeleteClick = (adjustment: StockAdjustmentData) => {
        setDeleteDialog({
            open: true,
            adjustment: adjustment,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.adjustment) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('inventory.stock-adjustments.destroy', deleteDialog.adjustment.id), {
                onSuccess: () => {
                    toast.success(`Stock Adjustment ${deleteDialog.adjustment?.adjustment_number} berhasil dihapus`);
                    setDeleteDialog({
                        open: false,
                        adjustment: null,
                        loading: false,
                    });
                },
                onError: () => {
                    toast.error('Gagal menghapus stock adjustment');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus stock adjustment');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, adjustment: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Adjustments" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Stock Adjustments
                    </CardTitle>
                    <CardDescription>
                        Kelola penyesuaian stok untuk koreksi, kerusakan, dan kehilangan barang
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
                                    placeholder="Cari adjustment number, catatan..."
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
                                <PermissionGate permission="stock-adjustment.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 hover:bg-green-50"
                                        onClick={() => router.visit('/inventory/stock-adjustments/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        <span className="hidden sm:inline">Buat Adjustment</span>
                                        <span className="sm:hidden">Buat</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Stock Adjustments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                            <label className="text-sm font-medium mb-2 block">Status</label>
                                            <SearchableSelect
                                                value={status}
                                                onValueChange={setStatus}
                                                options={statusOptions}
                                                placeholder="Pilih status"
                                                emptyText="Status tidak ditemukan"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Tipe</label>
                                            <SearchableSelect
                                                value={type}
                                                onValueChange={setType}
                                                options={typeOptions}
                                                placeholder="Pilih tipe"
                                                emptyText="Tipe tidak ditemukan"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Alasan</label>
                                            <SearchableSelect
                                                value={reason}
                                                onValueChange={setReason}
                                                options={reasonOptions}
                                                placeholder="Pilih alasan"
                                                emptyText="Alasan tidak ditemukan"
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
                                    <TableHead>Adjustment Number</TableHead>
                                    <TableHead>Toko</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Value Impact</TableHead>
                                    <TableHead className="w-[120px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adjustments.data.length > 0 ? (
                                    adjustments.data.map((adjustment, index) => (
                                        <TableRow key={adjustment.id}>
                                            <TableCell>{(adjustments.current_page - 1) * adjustments.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{adjustment.adjustment_number}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        oleh {adjustment.created_by?.name || 'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{adjustment.store?.name || 'Unknown Store'}</TableCell>
                                            <TableCell>
                                                {getTypeBadge(adjustment.type)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{adjustment.formatted_reason}</span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(adjustment.adjustment_date).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(adjustment.status)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium">{adjustment.items_count} item(s)</span>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${
                                                (adjustment.total_value_impact || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(adjustment.total_value_impact)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <PermissionGate permission="stock-adjustment.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/inventory/stock-adjustments/${adjustment.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="stock-adjustment.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/inventory/stock-adjustments/${adjustment.id}/edit`)}
                                                            disabled={adjustment.status !== 'draft'}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="stock-adjustment.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(adjustment)}
                                                            disabled={adjustment.status !== 'draft'}
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
                                                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                                                <p>Tidak ada stock adjustment yang ditemukan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {adjustments.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {(adjustments.current_page - 1) * adjustments.per_page + 1} - {Math.min(adjustments.current_page * adjustments.per_page, adjustments.total)} dari {adjustments.total} stock adjustments
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={adjustments.current_page === 1}
                                    onClick={() => router.visit(`/inventory/stock-adjustments?page=${adjustments.current_page - 1}`)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={adjustments.current_page === adjustments.last_page}
                                    onClick={() => router.visit(`/inventory/stock-adjustments?page=${adjustments.current_page + 1}`)}
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
                            Apakah Anda yakin ingin menghapus Stock Adjustment "{deleteDialog.adjustment?.adjustment_number}"? 
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
