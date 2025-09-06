import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Eye, Edit3, Trash2, CreditCard, DollarSign, Percent, Activity } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentMethodData {
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: string;
    fee_percentage: number;
    fee_fixed: number;
    requires_reference: boolean;
    requires_authorization: boolean;
    sort_order: number;
    settings: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    usage_count?: number;
}

interface StatsData {
    total_methods: number;
    active_methods: number;
    total_usage: number;
    total_fees_collected: number;
}

interface Props {
    paymentMethods: {
        data: PaymentMethodData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    stats: StatsData;
    search?: string;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Penjualan', href: '/sales' },
    { title: 'Metode Pembayaran', href: '/sales/payment-methods' },
];

export default function PaymentMethodIndex() {
    const { paymentMethods, stats, search: initialSearch } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(initialSearch || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        method: PaymentMethodData | null;
    }>({
        open: false,
        method: null,
    });

    const handleSearch = (value: string) => {
        router.get('/sales/payment-methods', {
            search: value,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleToggleStatus = (method: PaymentMethodData) => {
        router.post(`/sales/payment-methods/${method.id}/toggle-status`, {}, {
            onSuccess: () => {
                toast.success(`Payment method ${method.is_active ? 'deactivated' : 'activated'} successfully`);
            },
            onError: () => {
                toast.error('Failed to update payment method status');
            }
        });
    };

    const handleDelete = (method: PaymentMethodData) => {
        setDeleteDialog({ open: true, method });
    };

    const handleDeleteConfirm = () => {
        if (deleteDialog.method) {
            router.delete(`/sales/payment-methods/${deleteDialog.method.id}`, {
                onSuccess: () => {
                    toast.success('Payment method deleted successfully');
                    setDeleteDialog({ open: false, method: null });
                },
                onError: () => {
                    toast.error('Failed to delete payment method');
                }
            });
        }
    };

    const getTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            'cash': 'bg-green-100 text-green-800',
            'card': 'bg-blue-100 text-blue-800',
            'digital': 'bg-purple-100 text-purple-800',
            'bank_transfer': 'bg-orange-100 text-orange-800',
            'credit': 'bg-red-100 text-red-800',
            'other': 'bg-gray-100 text-gray-800',
        };

        return (
            <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
                {type.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    const getFeeDisplay = (method: PaymentMethodData) => {
        const hasPercentageFee = method.fee_percentage > 0;
        const hasFixedFee = method.fee_fixed > 0;
        
        if (!hasPercentageFee && !hasFixedFee) {
            return <span className="text-green-600">Tanpa Biaya</span>;
        } else if (hasPercentageFee && !hasFixedFee) {
            return <span className="text-blue-600">{method.fee_percentage}%</span>;
        } else if (!hasPercentageFee && hasFixedFee) {
            return <span className="text-orange-600">{formatCurrency(method.fee_fixed)}</span>;
        } else {
            return (
                <div className="text-sm">
                    <div className="text-blue-600">{method.fee_percentage}%</div>
                    <div className="text-orange-600">+ {formatCurrency(method.fee_fixed)}</div>
                </div>
            );
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

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Methods" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Metode Pembayaran
                    </CardTitle>
                    <CardDescription>
                        Kelola metode pembayaran dan struktur biayanya
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Actions */}
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
                                    placeholder="Cari metode pembayaran..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-[300px]"
                                />
                                <Button type="submit" size="sm" className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Cari
                                </Button>
                            </form>
                            
                            <PermissionGate permission="payment-method.create">
                                <Button 
                                    className="flex items-center gap-2"
                                    onClick={() => router.visit('/sales/payment-methods/create')}
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Metode Pembayaran
                                </Button>
                            </PermissionGate>
                        </div>
                    </div>
                    
                    <div className="mt-6 w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Struktur Biaya</TableHead>
                                    <TableHead className="text-center">Penggunaan</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="w-[150px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentMethods.data.length > 0 ? (
                                    paymentMethods.data.map((method, index) => (
                                        <TableRow key={method.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <span className="font-mono font-medium text-blue-600">
                                                    {method.code}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{method.name}</div>
                                                    {method.description && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {method.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getTypeBadge(method.type)}
                                            </TableCell>
                                            <TableCell>
                                                {getFeeDisplay(method)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-medium">{method.usage_count || 0}</span>
                                                    <span className="text-xs text-muted-foreground">transaksi aktif</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <PermissionGate permission="payment-method.edit" fallback={
                                                    <div className="flex items-center justify-center">
                                                        <Switch
                                                            checked={method.is_active}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                }>
                                                    <div className="flex items-center justify-center">
                                                        <Switch
                                                            checked={method.is_active}
                                                            onCheckedChange={() => handleToggleStatus(method)}
                                                        />
                                                    </div>
                                                </PermissionGate>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <PermissionGate permission="payment-method.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/sales/payment-methods/${method.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="payment-method.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/sales/payment-methods/${method.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="payment-method.delete">
                                                        {(method.usage_count === 0 || !method.usage_count) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDelete(method)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </PermissionGate>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Tidak ada metode pembayaran ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Payment Method Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, method: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Payment Method</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payment method? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteDialog.method && (
                        <div className="py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Kode:</span>
                                    <span className="font-medium font-mono">{deleteDialog.method.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Nama:</span>
                                    <span className="font-medium">{deleteDialog.method.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tipe:</span>
                                    <span className="font-medium">{deleteDialog.method.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Biaya:</span>
                                    <span className="font-medium">{getFeeDisplay(deleteDialog.method)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Jumlah Penggunaan:</span>
                                    <span className="font-medium">{deleteDialog.method.usage_count || 0}</span>
                                </div>
                            </div>
                            {deleteDialog.method.usage_count && deleteDialog.method.usage_count > 0 && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                    <div className="text-sm text-red-800">
                                        <strong>Peringatan:</strong> Metode pembayaran ini telah digunakan dalam {deleteDialog.method.usage_count} transaksi aktif. 
                                        Menghapusnya dapat mempengaruhi record transaksi.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, method: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete Payment Method
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
