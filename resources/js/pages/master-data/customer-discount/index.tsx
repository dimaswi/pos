import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { 
    PlusCircle, 
    Search, 
    Eye, 
    Edit3, 
    Trash, 
    Filter,
    X,
    Percent,
    Loader2
} from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { toast } from 'sonner';

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
    minimum_purchase: number;
    maximum_discount: number | null;
    is_active: boolean;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    customerDiscounts: {
        data: CustomerDiscount[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    filters?: {
        search: string;
        is_active: string;
        perPage: number;
    };
    [key: string]: any;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Data',
        href: '/master-data',
    },
    {
        title: 'Jenis Member',
        href: '/master-data/customer-discounts',
    },
];

export default function CustomerDiscountIndex() {
    const { customerDiscounts, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [isActive, setIsActive] = useState(initialFilters?.is_active || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        customerDiscount: CustomerDiscount | null;
        loading: boolean;
    }>({
        open: false,
        customerDiscount: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: '1', label: 'Aktif' },
        { value: '0', label: 'Tidak Aktif' }
    ];

    const handleSearch = (value: string) => {
        router.get('/master-data/customer-discounts', {
            search: value,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/master-data/customer-discounts', {
            search: search,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setIsActive('all');
        router.get('/master-data/customer-discounts', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (customerDiscount: CustomerDiscount) => {
        setDeleteDialog({
            open: true,
            customerDiscount: customerDiscount,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.customerDiscount) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('master-data.customer-discounts.destroy', deleteDialog.customerDiscount.id), {
                onSuccess: () => {
                    toast.success(`Jenis member ${deleteDialog.customerDiscount?.name} berhasil dihapus`);
                    setDeleteDialog({ open: false, customerDiscount: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus jenis member');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus jenis member');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, customerDiscount: null, loading: false });
    };

    const handleToggleStatus = (customerDiscount: CustomerDiscount) => {
        router.patch(
            route('master-data.customer-discounts.toggle-status', customerDiscount.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const status = !customerDiscount.is_active ? 'diaktifkan' : 'dinonaktifkan';
                    toast.success(`Jenis member berhasil ${status}`);
                }
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jenis Member" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        Jenis Member
                    </CardTitle>
                    <CardDescription>
                        Kelola jenis member dan pengaturan diskon untuk customer
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
                                    placeholder="Cari jenis member..."
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
                                <PermissionGate permission="customer-discount.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex items-center gap-2 hover:bg-green-200"
                                        onClick={() => router.visit('/master-data/customer-discounts/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        Tambah
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Jenis Member</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Jenis Member</TableHead>
                                    <TableHead>Diskon (%)</TableHead>
                                    <TableHead>Min. Pembelian</TableHead>
                                    <TableHead>Maks. Diskon</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerDiscounts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Tidak ada jenis member yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customerDiscounts.data.map((customerDiscount) => (
                                        <TableRow key={customerDiscount.id}>
                                            <TableCell className="font-medium">
                                                {customerDiscount.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-green-600">
                                                    {customerDiscount.discount_percentage}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(customerDiscount.minimum_purchase)}
                                            </TableCell>
                                            <TableCell>
                                                {customerDiscount.maximum_discount 
                                                    ? formatCurrency(customerDiscount.maximum_discount)
                                                    : 'Tidak ada batas'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={customerDiscount.is_active ? 'default' : 'secondary'}>
                                                    {customerDiscount.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {customerDiscount.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(`/master-data/customer-discounts/${customerDiscount.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(`/master-data/customer-discounts/${customerDiscount.id}/edit`)}
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(customerDiscount)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {customerDiscounts.last_page > 1 && (
                        <div className="flex items-center justify-between px-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {customerDiscounts.from} hingga {customerDiscounts.to} dari {customerDiscounts.total} entri
                            </div>
                            <div className="flex items-center space-x-2">
                                {customerDiscounts.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`px-3 py-1 text-sm rounded-md ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : link.url
                                                ? 'bg-background border hover:bg-accent'
                                                : 'text-muted-foreground cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
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
                            Apakah Anda yakin ingin menghapus jenis member "{deleteDialog.customerDiscount?.name}"? 
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteCancel} disabled={deleteDialog.loading}>
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
