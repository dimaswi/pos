import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, CalendarIcon, Search, Filter, Eye, Edit, Trash2, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { toast } from 'sonner';

interface Store {
    id: number;
    name: string;
}

interface ReturnItem {
    id: number;
    product: {
        id: number;
        name: string;
        sku: string;
    };
    quantity: number;
    unit_price: number;
    refund_amount: number;
    reason: string;
    condition: string;
}

interface SalesReturn {
    id: number;
    return_number: string;
    sales_transaction: {
        id: number;
        transaction_number: string;
        customer?: {
            id: number;
            name: string;
        };
    };
    store: {
        id: number;
        name: string;
    };
    return_date: string;
    reason: string;
    refund_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    return_items?: ReturnItem[];
    created_by?: {
        id: number;
        name: string;
    };
    processed_by?: {
        id: number;
        name: string;
    };
    processed_at?: string;
    created_at: string;
    status_badge: {
        color: string;
        text: string;
    };
    total_items: number;
    can_be_edited: boolean;
    can_be_deleted: boolean;
    can_be_approved: boolean;
    can_be_rejected: boolean;
}

interface Stats {
    total_returns: number;
    pending_returns: number;
    approved_returns: number;
    total_refund_amount: number;
}

interface Filters {
    search?: string;
    store_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    perPage?: string;
}

interface Props {
    returns: {
        data: SalesReturn[];
        links: any;
        meta: any;
    };
    stores: Store[];
    stats: Stats;
    filters: Filters;
}

export default function Index({ returns, stores, stats, filters }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Penjualan', href: '/sales' },
        { title: 'Retur Penjualan', href: '/sales/returns' },
    ];
    
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        store_id: filters.store_id || '',
        status: filters.status || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        perPage: filters.perPage || '15',
    });

    const handleFilter = () => {
        get(route('sales.returns.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            search: '',
            store_id: '',
            status: '',
            date_from: '',
            date_to: '',
            perPage: '15',
        });
        
        router.get(route('sales.returns.index'));
    };

    const handleDelete = async (returnId: number) => {
        setIsDeleting(returnId);
        try {
            router.delete(route('sales.returns.destroy', returnId), {
                onSuccess: () => {
                    toast.success('Retur berhasil dihapus');
                },
                onError: () => {
                    toast.error('Gagal menghapus retur');
                },
                onFinish: () => {
                    setIsDeleting(null);
                }
            });
        } catch (error) {
            setIsDeleting(null);
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending': return 'default';
            case 'approved': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    const getConditionBadgeVariant = (condition: string) => {
        switch (condition) {
            case 'good': return 'success';
            case 'damaged': return 'warning';
            case 'defective': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retur Penjualan" />

            <Card className="mt-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowLeft className="h-5 w-5" />
                                Manajemen Retur Penjualan
                            </CardTitle>
                            <CardDescription>
                                Kelola retur penjualan dan refund pelanggan
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Filter Section */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleFilter();
                                }}
                                className="flex flex-1 items-center gap-2"
                            >
                                <Input
                                    type="text"
                                    placeholder="Cari retur..."
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                    className="flex-1 md:w-[300px] md:flex-none"
                                />
                                <Button type="submit" variant="outline" disabled={processing} className="shrink-0">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Cari</span>
                                </Button>
                            </form>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filter</span>
                                </Button>
                                <PermissionGate permission="return.create">
                                    <Link href={route('sales.returns.create')}>
                                        <Button className="flex-1 sm:flex-none justify-center flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            <span className="hidden sm:inline">Retur Baru</span>
                                            <span className="sm:hidden">Baru</span>
                                        </Button>
                                    </Link>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div>
                                            <Select value={data.store_id || "all"} onValueChange={(value) => setData('store_id', value === "all" ? "" : value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Semua Toko" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Toko</SelectItem>
                                                    {stores.map((store) => (
                                                        <SelectItem key={store.id} value={store.id.toString()}>
                                                            {store.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div>
                                            <Select value={data.status || "all"} onValueChange={(value) => setData('status', value === "all" ? "" : value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Semua Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Status</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="approved">Disetujui</SelectItem>
                                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div>
                                            <Input
                                                type="date"
                                                placeholder="Tanggal Mulai"
                                                value={data.date_from}
                                                onChange={(e) => setData('date_from', e.target.value)}
                                            />
                                        </div>
                                        
                                        <div>
                                            <Input
                                                type="date"
                                                placeholder="Tanggal Akhir"
                                                value={data.date_to}
                                                onChange={(e) => setData('date_to', e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button onClick={handleFilter} disabled={processing}>
                                                Terapkan
                                            </Button>
                                            <Button variant="outline" onClick={handleReset}>
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    {/* Table */}
                    <div className="mt-6 w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Retur</TableHead>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Toko</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Tanggal Retur</TableHead>
                                    <TableHead>Jumlah Barang</TableHead>
                                    <TableHead>Jumlah Refund</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!returns?.data || returns.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data retur ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    returns.data.map((returnItem) => (
                                        <TableRow key={returnItem.id}>
                                            <TableCell className="font-medium">
                                                {returnItem.return_number}
                                            </TableCell>
                                            <TableCell>
                                                <Link 
                                                    href={route('sales.transactions.show', returnItem.sales_transaction.id)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {returnItem.sales_transaction.transaction_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{returnItem.store.name}</TableCell>
                                            <TableCell>
                                                {returnItem.sales_transaction.customer?.name || 'Pelanggan Umum'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>{returnItem.total_items}</TableCell>
                                            <TableCell className="font-mono">
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0,
                                                }).format(returnItem.refund_amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(returnItem.status)}>
                                                    {returnItem.status === 'pending' ? 'Pending' : 
                                                     returnItem.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <PermissionGate permission="return.view">
                                                        <Link href={route('sales.returns.show', returnItem.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Lihat
                                                            </Button>
                                                        </Link>
                                                    </PermissionGate>
                                                    
                                                    <PermissionGate permission="return.edit">
                                                        {returnItem.can_be_edited && (
                                                            <Link href={route('sales.returns.edit', returnItem.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </PermissionGate>
                                                    
                                                    <PermissionGate permission="return.delete">
                                                        {returnItem.can_be_deleted && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        disabled={isDeleting === returnItem.id}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                                        {isDeleting === returnItem.id ? 'Menghapus...' : 'Hapus'}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Hapus Retur</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Apakah Anda yakin ingin menghapus retur <strong>{returnItem.return_number}</strong>? 
                                                                            Tindakan ini tidak dapat dibatalkan.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                    <AlertDialogAction 
                                                                        onClick={() => handleDelete(returnItem.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Hapus
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    </PermissionGate>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {returns?.meta?.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm text-muted-foreground">
                                    Menampilkan {returns.meta.from || 0} sampai {returns.meta.to || 0} dari {returns.meta.total || 0} hasil
                                </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Select
                                    value={data.perPage}
                                    onValueChange={(value) => {
                                        setData('perPage', value);
                                        handleFilter();
                                    }}
                                >
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <div className="flex space-x-1">
                                    {returns.links?.map((link: any, index: number) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
