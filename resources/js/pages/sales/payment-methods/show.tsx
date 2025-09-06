import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Edit3, Trash2, ArrowLeft, Activity, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';

interface TransactionData {
    id: number;
    transaction_number: string;
    total_amount: number;
    amount_paid: number;
    fee_amount: number;
    transaction_date: string;
    status: string;
}

interface UsageStatsData {
    total_transactions: number;
    total_amount: number;
    total_fees: number;
    this_month_transactions: number;
    this_month_amount: number;
    this_month_fees: number;
}

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
    recent_transactions?: TransactionData[];
    usage_stats?: UsageStatsData;
}

interface Props {
    paymentMethod: PaymentMethodData;
    [key: string]: any;
}

export default function PaymentMethodShow() {
    const { paymentMethod } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Penjualan', href: '/sales' },
        { title: 'Metode Pembayaran', href: '/sales/payment-methods' },
        { title: paymentMethod.name, href: `/sales/payment-methods/${paymentMethod.id}` },
    ];

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
            case 'voided':
                return <Badge className="bg-gray-100 text-gray-800">Dibatalkan</Badge>;
            case 'refunded':
                return <Badge className="bg-blue-100 text-blue-800">Dikembalikan</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getFeeDisplay = (method: PaymentMethodData) => {
        if (method.fee_percentage === 0 && method.fee_fixed === 0) {
            return 'No Fee';
        } else if (method.fee_percentage > 0) {
            return `${method.fee_percentage}% per transaction`;
        } else {
            return `${formatCurrency(method.fee_fixed)} per transaction`;
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = () => {
        router.delete(`/sales/payment-methods/${paymentMethod.id}`, {
            onSuccess: () => {
                toast.success('Payment method deleted successfully');
            },
            onError: () => {
                toast.error('Failed to delete payment method');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment Method - ${paymentMethod.name}`} />

            <div className="space-y-6 mt-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <PermissionGate permission="payment-method.index">
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/sales/payment-methods')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Metode Pembayaran
                        </Button>
                    </PermissionGate>

                    <div className="flex items-center gap-2">
                        <PermissionGate permission="payment-method.edit">
                            <Button
                                variant="outline"
                                onClick={() => router.visit(`/sales/payment-methods/${paymentMethod.id}/edit`)}
                                className="flex items-center gap-2"
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit
                            </Button>
                        </PermissionGate>
                        
                        <PermissionGate permission="payment-method.delete">
                            {(paymentMethod.usage_count || 0) === 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteDialog(true)}
                                    className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </PermissionGate>
                    </div>
                </div>

                {/* Usage Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transaksi Aktif</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{paymentMethod.usage_stats?.total_transactions || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Bulan ini: {paymentMethod.usage_stats?.this_month_transactions || 0}
                            </p>
                            <p className="text-xs text-orange-600">
                                *Tidak termasuk transaksi yang dibatalkan/direfund
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Jumlah Aktif</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(paymentMethod.usage_stats?.total_amount || 0)}</div>
                            <p className="text-xs text-muted-foreground">
                                Bulan ini: {formatCurrency(paymentMethod.usage_stats?.this_month_amount || 0)}
                            </p>
                            <p className="text-xs text-orange-600">
                                *Tidak termasuk transaksi yang dibatalkan/direfund
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Biaya Terkumpul</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(paymentMethod.usage_stats?.total_fees || 0)}</div>
                            <p className="text-xs text-muted-foreground">
                                Bulan ini: {formatCurrency(paymentMethod.usage_stats?.this_month_fees || 0)}
                            </p>
                            <p className="text-xs text-orange-600">
                                *Tidak termasuk transaksi yang dibatalkan/direfund
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment Method Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Detail Metode Pembayaran
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Nama</label>
                                                <div className="text-lg font-semibold">{paymentMethod.name}</div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Tipe</label>
                                                <div className="mt-1">{getTypeBadge(paymentMethod.type)}</div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                                <div className="mt-1">
                                                    <Badge className={paymentMethod.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                        {paymentMethod.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Struktur Biaya</label>
                                                <div className="font-medium">{getFeeDisplay(paymentMethod)}</div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Dibuat
                                                </label>
                                                <div className="font-medium">{formatDateTime(paymentMethod.created_at)}</div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</label>
                                                <div className="font-medium">{formatDateTime(paymentMethod.updated_at)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {paymentMethod.description && (
                                        <div className="pt-4 border-t">
                                            <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                                            <div className="mt-2 p-3 bg-gray-50 rounded">{paymentMethod.description}</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaksi Terbaru</CardTitle>
                                <CardDescription>
                                    Transaksi terbaru menggunakan metode pembayaran ini (tidak termasuk yang dibatalkan/direfund)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(paymentMethod.recent_transactions || []).length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>No. Transaksi</TableHead>
                                                    <TableHead className="text-right">Total Jumlah</TableHead>
                                                    <TableHead className="text-right">Jumlah Dibayar</TableHead>
                                                    <TableHead className="text-right">Biaya</TableHead>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead className="text-center">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(paymentMethod.recent_transactions || []).map((transaction) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell>
                                                            <button
                                                                onClick={() => router.visit(`/sales/transactions/${transaction.id}`)}
                                                                className="font-medium text-blue-600 hover:underline"
                                                            >
                                                                {transaction.transaction_number}
                                                            </button>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatCurrency(transaction.total_amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatCurrency(transaction.amount_paid)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatCurrency(transaction.fee_amount)}
                                                        </TableCell>
                                                        <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                                                        <TableCell className="text-center">
                                                            {getStatusBadge(transaction.status)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Tidak ada transaksi ditemukan untuk metode pembayaran ini.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction Limits and Settings */}
                    <div className="space-y-6">
                        {/* Fee Calculator */}
                        {(paymentMethod.fee_percentage > 0 || paymentMethod.fee_fixed > 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kalkulator Biaya</CardTitle>
                                    <CardDescription>
                                        Contoh perhitungan biaya untuk berbagai jumlah
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {[10000, 50000, 100000, 500000, 1000000].map((amount) => {
                                            let fee = paymentMethod.fee_fixed || 0;
                                            if (paymentMethod.fee_percentage > 0) {
                                                fee += amount * (paymentMethod.fee_percentage / 100);
                                            }
                                            
                                            return (
                                                <div key={amount} className="flex justify-between text-sm">
                                                    <span>{formatCurrency(amount)}</span>
                                                    <span className="font-mono text-orange-600">{formatCurrency(fee)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aksi Cepat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.visit('/sales/transactions?payment_method=' + paymentMethod.id)}
                                >
                                    Lihat Semua Transaksi
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.visit('/sales/transactions/create')}
                                >
                                    Buat Transaksi Baru
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Payment Method Dialog */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Payment Method</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payment method? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Name:</span>
                                <span className="font-medium">{paymentMethod.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="font-medium">{paymentMethod.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Usage:</span>
                                <span className="font-medium">{paymentMethod.usage_count || 0}</span>
                            </div>
                        </div>
                        {(paymentMethod.usage_count || 0) > 0 && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                <div className="text-sm text-red-800">
                                    <strong>Warning:</strong> This payment method has been used in {paymentMethod.usage_count || 0} transaction(s). 
                                    You cannot delete a payment method that has been used.
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={(paymentMethod.usage_count || 0) > 0}
                        >
                            Delete Payment Method
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
