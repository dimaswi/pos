import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Filter } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface SupplierData {
    id: number;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    suppliers: SupplierData[];
    filters?: {
        search: string;
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
        title: 'Supplier',
        href: '/master-data/suppliers',
    },
];

export default function SupplierIndex() {
    const { suppliers, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [isActive, setIsActive] = useState(initialFilters?.is_active || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        supplier: SupplierData | null;
        loading: boolean;
    }>({
        open: false,
        supplier: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: '1', label: 'Aktif' },
        { value: '0', label: 'Tidak Aktif' }
    ];

    const handleSearch = (value: string) => {
        router.get('/master-data/suppliers', {
            search: value,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/master-data/suppliers', {
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
        router.get('/master-data/suppliers', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (supplier: SupplierData) => {
        setDeleteDialog({
            open: true,
            supplier: supplier,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.supplier) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('master-data.suppliers.destroy', deleteDialog.supplier.id), {
                onSuccess: () => {
                    toast.success(`Supplier ${deleteDialog.supplier?.name} berhasil dihapus`);
                    setDeleteDialog({ open: false, supplier: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus supplier');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus supplier');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, supplier: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle>Supplier</CardTitle>
                    <CardDescription>
                        Kelola hubungan supplier dan informasi kontak
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
                                    placeholder="Cari supplier..."
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
                                <PermissionGate permission="supplier.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex items-center gap-2 hover:bg-green-200 flex-1 sm:flex-none justify-center"
                                        onClick={() => router.visit('/master-data/suppliers/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        <span className="hidden sm:inline">Tambah</span>
                                        <span className="sm:hidden">+</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Supplier</CardTitle>
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
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <TableHead>Nama Supplier</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Kota</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.length > 0 ? (
                                    suppliers.map((supplier: SupplierData, index: number) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell>{supplier.contact_person || '-'}</TableCell>
                                            <TableCell>{supplier.phone || '-'}</TableCell>
                                            <TableCell>{supplier.email || '-'}</TableCell>
                                            <TableCell>{supplier.city || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                                                    {supplier.is_active ? 'Aktif' : 'Non-aktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {hasPermission('supplier.view') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/master-data/suppliers/${supplier.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('supplier.edit') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/master-data/suppliers/${supplier.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('supplier.delete') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(supplier)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data supplier yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={handleDeleteCancel}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus supplier "{deleteDialog.supplier?.name}"? 
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
