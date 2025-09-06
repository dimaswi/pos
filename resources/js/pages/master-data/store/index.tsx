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

interface StoreData {
    id: number;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    created_at: string;
}

interface PaginatedStores {
    data: StoreData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    stores: PaginatedStores;
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
        title: 'Toko',
        href: '/master-data/stores',
    },
];

export default function StoreIndex() {
    const { stores, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [isActive, setIsActive] = useState(initialFilters?.is_active || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        store: StoreData | null;
        loading: boolean;
    }>({
        open: false,
        store: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: '1', label: 'Aktif' },
        { value: '0', label: 'Tidak Aktif' }
    ];

    const handleSearch = (value: string) => {
        router.get('/master-data/stores', {
            search: value,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/master-data/stores', {
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
        router.get('/master-data/stores', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (store: StoreData) => {
        setDeleteDialog({
            open: true,
            store: store,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.store) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('master-data.stores.destroy', deleteDialog.store.id), {
                onSuccess: () => {
                    toast.success(`Store ${deleteDialog.store?.name} berhasil dihapus`);
                    setDeleteDialog({ open: false, store: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus store');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus store');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, store: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Toko" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle>Toko</CardTitle>
                    <CardDescription>
                        Kelola lokasi dan informasi toko Anda
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
                                    placeholder="Cari toko..."
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
                                {hasPermission('store.create') && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex items-center gap-2 hover:bg-green-200"
                                        onClick={() => router.visit('/master-data/stores/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        Tambah Toko
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Toko</CardTitle>
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
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stores.data.length > 0 ? (
                                    stores.data.map((store: StoreData, index: number) => (
                                        <TableRow key={store.id}>
                                            <TableCell>
                                                {(stores.current_page - 1) * stores.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{store.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{store.code}</TableCell>
                                            <TableCell>{store.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={store.is_active ? 'default' : 'secondary'}>
                                                    {store.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {hasPermission('store.view') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/master-data/stores/${store.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('store.edit') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/master-data/stores/${store.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('store.delete') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(store)}
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
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data store yang ditemukan.
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
                            Apakah Anda yakin ingin menghapus store "{deleteDialog.store?.name}"? 
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
