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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Filter, User2, ToggleLeft, ToggleRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
}

interface Customer {
    id: number;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    birth_date: string | null;
    gender: 'male' | 'female' | null;
    customer_discount_id: number | null;
    customer_discount?: CustomerDiscount;
    membership_date: string | null;
    total_points: number;
    total_spent: number;
    total_transactions: number;
    last_transaction_date: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    customers: {
        data: Customer[];
        links: any[];
        meta: any;
    };
    customerDiscounts: CustomerDiscount[];
    filters?: {
        search: string;
        customer_discount_id: string;
        status: string;
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
        title: 'Pelanggan',
        href: '/master-data/customers',
    },
];

export default function CustomerIndex() {
    const { customers, customerDiscounts, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [customerDiscountId, setCustomerDiscountId] = useState(initialFilters?.customer_discount_id || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        customer: Customer | null;
        loading: boolean;
    }>({
        open: false,
        customer: null,
        loading: false,
    });

    // Prepare options for searchable selects
    const customerDiscountOptions = [
        { value: 'all', label: 'Semua Jenis Member' },
        { value: 'none', label: 'Tanpa Member' },
        ...(customerDiscounts || []).map(discount => ({
            value: discount.id.toString(),
            label: `${discount.name} (${discount.discount_percentage || 0}% diskon)`
        }))
    ];

    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'Tidak Aktif' }
    ];

    const handleSearch = (value: string) => {
        router.get('/master-data/customers', {
            search: value,
            customer_discount_id: customerDiscountId === 'all' ? '' : customerDiscountId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/master-data/customers', {
            search: search,
            customer_discount_id: customerDiscountId === 'all' ? '' : customerDiscountId,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setCustomerDiscountId('all');
        setStatus('all');
        router.get('/master-data/customers', {
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDeleteClick = (customer: Customer) => {
        setDeleteDialog({
            open: true,
            customer: customer,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.customer) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('master-data.customers.destroy', deleteDialog.customer.id), {
                onSuccess: () => {
                    toast.success(`Pelanggan ${deleteDialog.customer?.name} berhasil dihapus`);
                    setDeleteDialog({
                        open: false,
                        customer: null,
                        loading: false,
                    });
                },
                onError: () => {
                    toast.error('Gagal menghapus pelanggan');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus pelanggan');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, customer: null, loading: false });
    };

    const handleToggleStatus = (customer: Customer) => {
        router.patch(route('master-data.customers.toggle-status', customer.id), {}, {
            onSuccess: () => {
                const status = customer.is_active ? 'dinonaktifkan' : 'diaktifkan';
                toast.success(`Pelanggan ${customer.name} berhasil ${status}`);
            },
            onError: () => {
                toast.error('Gagal mengubah status pelanggan');
            }
        });
    };

    const getMemberTypeDisplay = (customer: Customer) => {
        if (customer.customer_discount) {
            return customer.customer_discount.name;
        }
        return 'Tanpa Member (Reguler)';
    };

    const getMemberTypeBadgeVariant = (customer: Customer) => {
        if (customer.customer_discount) {
            if (customer.customer_discount.discount_percentage >= 10) return 'default';
            if (customer.customer_discount.discount_percentage >= 5) return 'outline';
            return 'default';
        }
        return 'secondary';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(dateString));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelanggan" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle>Pelanggan</CardTitle>
                    <CardDescription>
                        Kelola data pelanggan untuk transaksi dan program keanggotaan
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
                                    placeholder="Cari pelanggan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 md:w-[300px] md:flex-none"
                                />
                                <Button type="submit" variant="outline" size="sm" className="shrink-0">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Cari</span>
                                </Button>
                            </form>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={showFilters ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex-1 sm:flex-none justify-center"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="ml-2 hidden sm:inline">Filter</span>
                                </Button>

                                <PermissionGate permission="customer.create">
                                    <Button 
                                        onClick={() => router.get(route('master-data.customers.create'))}
                                        size="sm"
                                        className="flex-1 sm:flex-none justify-center"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="ml-2 hidden sm:inline">Tambah Pelanggan</span>
                                        <span className="ml-2 sm:hidden">Tambah</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Jenis Member</label>
                                            <SearchableSelect
                                                options={customerDiscountOptions}
                                                value={customerDiscountId}
                                                onValueChange={setCustomerDiscountId}
                                                placeholder="Pilih jenis member..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Status</label>
                                            <SearchableSelect
                                                options={statusOptions}
                                                value={status}
                                                onValueChange={setStatus}
                                                placeholder="Pilih status..."
                                            />
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <Button onClick={handleFilter} className="flex-1">
                                                Terapkan Filter
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={handleClearFilters}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Customers Table */}
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Kontak</TableHead>
                                        <TableHead>Jenis Member</TableHead>
                                        <TableHead>Total Transaksi</TableHead>
                                        <TableHead>Total Belanja</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <User2 className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">Tidak ada data pelanggan</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        customers.data.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell className="font-medium">
                                                    {customer.code}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{customer.name}</p>
                                                        {customer.email && (
                                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {customer.phone && (
                                                            <p className="text-sm">{customer.phone}</p>
                                                        )}
                                                        {customer.address && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {customer.address.length > 30 
                                                                    ? customer.address.substring(0, 30) + '...' 
                                                                    : customer.address}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getMemberTypeBadgeVariant(customer)}>
                                                        {getMemberTypeDisplay(customer)}
                                                    </Badge>
                                                    {customer.customer_discount && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Diskon: {customer.customer_discount.discount_percentage}%
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{customer.total_transactions || 0}x</p>
                                                        {customer.last_transaction_date && (
                                                            <p className="text-muted-foreground">
                                                                Terakhir: {formatDate(customer.last_transaction_date)}
                                                            </p>
                                                        )}
                                                        {!customer.last_transaction_date && (
                                                            <p className="text-muted-foreground">
                                                                Belum pernah transaksi
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{formatCurrency(customer.total_spent || 0)}</p>
                                                        {customer.total_transactions > 0 && (
                                                            <p className="text-muted-foreground">
                                                                Avg: {formatCurrency((customer.total_spent || 0) / (customer.total_transactions || 1))}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                                                        {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <PermissionGate permission="customer.view">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(route('master-data.customers.show', customer.id))}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </PermissionGate>

                                                        <PermissionGate permission="customer.edit">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(route('master-data.customers.edit', customer.id))}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                                </Button>
                                                        </PermissionGate>

                                                        <PermissionGate permission="customer.edit">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(customer)}
                                                                >
                                                                    {customer.is_active ? (
                                                                        <ToggleRight className="h-4 w-4" />
                                                                    ) : (
                                                                        <ToggleLeft className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                        </PermissionGate>

                                                        <PermissionGate permission="customer.delete">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            onClick={() => handleDeleteClick(customer)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                        </PermissionGate>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Pagination */}
                        {customers.meta && customers.meta.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {customers.meta.from} hingga {customers.meta.to} dari {customers.meta.total} data
                                </div>
                                <div className="flex items-center gap-2">
                                    {customers.links.map((link: any, index: number) => (
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
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <PermissionGate permission="customer.delete">
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus pelanggan "{deleteDialog.customer?.name}"? 
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
