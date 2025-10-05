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
    code: string;
    description: string;
    parent_id: number | null;
    is_active: boolean;
    parent?: {
        id: number;
        name: string;
    };
    children?: CategoryData[];
    created_at: string;
}

interface Props {
    categories: CategoryData[];
    parentCategories: CategoryData[];
    filters?: {
        search: string;
        parent_id: string;
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
        title: 'Kategori',
        href: '/master-data/categories',
    },
];

export default function CategoryIndex() {
    const { categories, parentCategories, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [parentId, setParentId] = useState(initialFilters?.parent_id || 'all');
    const [isActive, setIsActive] = useState(initialFilters?.is_active || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        category: CategoryData | null;
        loading: boolean;
    }>({
        open: false,
        category: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const parentOptions = [
        { value: 'all', label: 'Semua Parent' },
        { value: 'null', label: 'Kategori Utama' },
        ...parentCategories.map(parent => ({
            value: parent.id.toString(),
            label: parent.name
        }))
    ];

    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: '1', label: 'Aktif' },
        { value: '0', label: 'Tidak Aktif' }
    ];

    const handleSearch = (value: string) => {
        router.get('/master-data/categories', {
            search: value,
            parent_id: parentId === 'all' ? '' : parentId,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/master-data/categories', {
            search: search,
            parent_id: parentId === 'all' ? '' : parentId,
            is_active: isActive === 'all' ? '' : isActive,
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setParentId('all');
        setIsActive('all');
        router.get('/master-data/categories', {
            perPage: initialFilters?.perPage || 10,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (category: CategoryData) => {
        setDeleteDialog({
            open: true,
            category: category,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.category) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('master-data.categories.destroy', deleteDialog.category.id), {
                onSuccess: () => {
                    toast.success(`Category ${deleteDialog.category?.name} berhasil dihapus`);
                    setDeleteDialog({
                        open: false,
                        category: null,
                        loading: false,
                    });
                },
                onError: () => {
                    toast.error('Gagal menghapus category');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus category');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, category: null, loading: false });
    };

    // Flatten categories for table display
    const flattenCategories = (categories: CategoryData[], level = 0): Array<CategoryData & { level: number }> => {
        let result: Array<CategoryData & { level: number }> = [];
        
        categories.forEach(category => {
            result.push({ ...category, level });
            if (category.children && category.children.length > 0) {
                result = result.concat(flattenCategories(category.children, level + 1));
            }
        });
        
        return result;
    };

    const flatCategories = flattenCategories(categories);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle>Kategori</CardTitle>
                    <CardDescription>
                        Kelola produk Anda dengan kategori yang terstruktur
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
                                    placeholder="Cari kategori..."
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
                                <PermissionGate permission="category.create">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex items-center gap-2 hover:bg-green-200 flex-1 sm:flex-none justify-center"
                                        onClick={() => router.visit('/master-data/categories/create')}
                                    >
                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                        <span className="hidden sm:inline">Tambah Kategori</span>
                                        <span className="sm:hidden">Tambah</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Kategori</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Parent Kategori</label>
                                            <SearchableSelect
                                                value={parentId}
                                                onValueChange={setParentId}
                                                options={parentOptions}
                                                placeholder="Pilih parent kategori"
                                                emptyText="Parent kategori tidak ditemukan"
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
                                    <TableHead>Nama Kategori</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {flatCategories.length > 0 ? (
                                    flatCategories.map((category, index) => (
                                        <TableRow key={category.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    {Array.from({ length: category.level }).map((_, i) => (
                                                        <span key={i} className="w-4 h-4 mr-1">
                                                            {i === category.level - 1 ? '└─' : ''}
                                                        </span>
                                                    ))}
                                                    <span className="font-medium">{category.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{category.code}</TableCell>
                                            <TableCell>
                                                {category.parent ? category.parent.name : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                    {category.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <PermissionGate permission="category.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/master-data/categories/${category.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="category.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/master-data/categories/${category.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="category.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(category)}
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
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data kategori yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <PermissionGate permission="category.delete">
                <Dialog open={deleteDialog.open} onOpenChange={handleDeleteCancel}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus kategori "{deleteDialog.category?.name}"? 
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
