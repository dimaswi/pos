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
import { Receipt, Edit3, Printer, RefreshCw, Ban, ArrowLeft, Calendar, Store, User, CreditCard } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoreData {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
}

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
    minimum_purchase: number;
    maximum_discount: number | null;
}

interface CustomerData {
    id: number;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    customer_type: string;
    customer_discount_id: number | null;
    customer_discount?: CustomerDiscount;
}

interface UserData {
    id: number;
    name: string;
    email: string;
}

interface SalesItemData {
    id: number;
    product_id: number;
    product: {
        name: string;
        sku: string;
    };
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
}

interface SalesPaymentData {
    id: number;
    payment_method_id: number;
    payment_method: {
        name: string;
        type: string;
    };
    amount: number;
    fee_amount: number;
    reference_number: string | null;
    authorization_code: string | null;
    status: string;
    created_at: string;
}

interface SalesTransactionData {
    id: number;
    transaction_number: string;
    reference_number: string | null;
    store_id: number;
    customer_id: number | null;
    user_id: number;
    transaction_date: string;
    subtotal_amount: number;
    discount_amount: number;
    customer_discount_amount: number;
    customer_discount_percentage: number;
    additional_discount_amount: number;
    discount_id: number | null;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    change_amount: number;
    status: string;
    payment_status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    store: StoreData;
    customer: CustomerData | null;
    user: UserData | null;
    sales_items: SalesItemData[];
    payments: SalesPaymentData[];
}

interface Props {
    transaction: SalesTransactionData;
    hasApprovedReturns: boolean;
    hasPendingReturns: boolean;
    [key: string]: any;
}

export default function SalesTransactionShow() {
    const { transaction, hasApprovedReturns, hasPendingReturns } = usePage<Props>().props;
    const [voidDialog, setVoidDialog] = useState(false);
    const [refundDialog, setRefundDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Penjualan', href: '/sales' },
        { title: 'Transaksi', href: '/sales/transactions' },
        { title: transaction.transaction_number, href: `/sales/transactions/${transaction.id}` },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
            case 'refunded':
                return <Badge className="bg-blue-100 text-blue-800">Dikembalikan</Badge>;
            case 'voided':
                return <Badge className="bg-gray-100 text-gray-800">Dibatalkan</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
            case 'partial':
                return <Badge className="bg-yellow-100 text-yellow-800">Sebagian</Badge>;
            case 'pending':
                return <Badge className="bg-gray-100 text-gray-800">Menunggu</Badge>;
            case 'overpaid':
                return <Badge className="bg-blue-100 text-blue-800">Lebih Bayar</Badge>;
            default:
                return <Badge variant="outline">{paymentStatus}</Badge>;
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
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleVoidTransaction = () => {
        // Check if transaction status is refunded
        if (transaction.status === 'refunded') {
            toast.error('Tidak dapat membatalkan transaksi yang sudah direfund');
            return;
        }

        // Check if transaction has approved returns
        if (hasApprovedReturns) {
            toast.error('Tidak dapat membatalkan transaksi yang sudah memiliki retur disetujui');
            return;
        }

        router.post(`/sales/transactions/${transaction.id}/void`, {}, {
            onSuccess: () => {
                toast.success('Transaksi berhasil dibatalkan');
                setVoidDialog(false);
            },
            onError: () => {
                toast.error('Gagal membatalkan transaksi');
            }
        });
    };

    const handleRefundTransaction = async () => {
        // Check if transaction status is refunded
        if (transaction.status === 'refunded') {
            toast.error('Transaksi ini sudah direfund');
            return;
        }

        // Check if transaction has approved returns
        if (hasApprovedReturns) {
            toast.error('Transaksi ini sudah memiliki retur yang disetujui');
            return;
        }

        // Check if transaction has pending returns
        if (hasPendingReturns) {
            toast.error('Transaksi ini sudah memiliki retur yang sedang menunggu persetujuan');
            return;
        }

        try {
            // Check if there's already a pending return for this transaction
            const response = await fetch(`/sales/returns/check-existing?transaction_number=${transaction.transaction_number}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.exists) {
                    toast.error('Sudah ada retur untuk transaksi ini yang sedang menunggu persetujuan');
                    return;
                }
            }
            
            // If no existing return found or API call fails, proceed to create return
            router.visit(`/sales/returns/create?transaction_id=${transaction.id}`);
            
        } catch (error) {
            // If API fails, still allow to proceed but show warning
            toast.warning('Tidak dapat memeriksa status retur, melanjutkan ke halaman retur');
            router.visit(`/sales/returns/create?transaction_id=${transaction.id}`);
        }
    };

    const handlePrintReceipt = () => {
        window.open(`/sales/transactions/${transaction.id}/receipt`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transaksi ${transaction.transaction_number}`} />

            <div className="space-y-6 mt-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <PermissionGate permission="sales.index">
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/sales/transactions')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Transaksi
                        </Button>
                    </PermissionGate>

                    <div className="flex items-center gap-2">
                        <PermissionGate permission="sales.print">
                            {transaction.status === 'completed' && (
                                <Button
                                    variant="outline"
                                    onClick={handlePrintReceipt}
                                    className="flex items-center gap-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    Cetak Struk
                                </Button>
                            )}
                        </PermissionGate>
                        
                        <PermissionGate permission="sales.edit">
                            {transaction.status === 'pending' && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.visit(`/sales/transactions/${transaction.id}/edit`)}
                                    className="flex items-center gap-2"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                        </PermissionGate>
                        
                        <PermissionGate permission="return.create">
                            {transaction.status === 'completed' && !hasApprovedReturns && !hasPendingReturns && (
                                <Button
                                    variant="outline"
                                    onClick={handleRefundTransaction}
                                    className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Buat Retur
                                </Button>
                            )}
                        </PermissionGate>
                        
                        <PermissionGate permission="sales.void">
                            {transaction.status === 'completed' && !hasApprovedReturns && (
                                <Button
                                    variant="outline"
                                    onClick={() => setVoidDialog(true)}
                                    className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                                >
                                    <Ban className="h-4 w-4" />
                                    Batalkan Transaksi
                                </Button>
                            )}
                        </PermissionGate>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transaction Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Transaction Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Informasi Transaksi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Nomor Transaksi</label>
                                            <div className="text-lg font-mono font-semibold">{transaction.transaction_number}</div>
                                        </div>
                                        
                                        {transaction.reference_number && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Nomor Referensi</label>
                                                <div className="font-medium">{transaction.reference_number}</div>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {getStatusBadge(transaction.status)}
                                                {getPaymentStatusBadge(transaction.payment_status)}
                                                {hasApprovedReturns && (
                                                    <Badge className="bg-orange-100 text-orange-800">Ada Retur Disetujui</Badge>
                                                )}
                                                {hasPendingReturns && (
                                                    <Badge className="bg-yellow-100 text-yellow-800">Ada Retur Pending</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Tanggal Transaksi
                                            </label>
                                            <div className="font-medium">{formatDateTime(transaction.transaction_date)}</div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                <Store className="h-4 w-4" />
                                                Toko
                                            </label>
                                            <div className="font-medium">{transaction.store.name}</div>
                                            {transaction.store.address && (
                                                <div className="text-sm text-muted-foreground">{transaction.store.address}</div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                Kasir
                                            </label>
                                            <div className="font-medium">{transaction.user?.name || 'Pengguna Tidak Dikenal'}</div>
                                            <div className="text-sm text-muted-foreground">{transaction.user?.email || 'Tidak ada email'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Customer Information */}
                                <div className="mt-6 pt-6 border-t">
                                    <label className="text-sm font-medium text-muted-foreground">Pelanggan</label>
                                    {transaction.customer ? (
                                        <div className="mt-2">
                                            <div className="font-medium">{transaction.customer.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Kode: {transaction.customer.code} | Tipe: {transaction.customer.customer_type}
                                            </div>
                                            {transaction.customer.email && (
                                                <div className="text-sm text-muted-foreground">Email: {transaction.customer.email}</div>
                                            )}
                                            {transaction.customer.phone && (
                                                <div className="text-sm text-muted-foreground">Telepon: {transaction.customer.phone}</div>
                                            )}
                                            {transaction.customer.customer_discount && (
                                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                                    <div className="text-sm font-medium text-blue-700">
                                                        Member: {transaction.customer.customer_discount.name}
                                                    </div>
                                                    <div className="text-xs text-blue-600">
                                                        Diskon {transaction.customer.customer_discount.discount_percentage}% 
                                                        (Min. pembelian: {formatCurrency(transaction.customer.customer_discount.minimum_purchase)})
                                                        {transaction.customer.customer_discount.maximum_discount && (
                                                            <span> | Maks. diskon: {formatCurrency(transaction.customer.customer_discount.maximum_discount)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-muted-foreground">Pelanggan Umum</div>
                                    )}
                                </div>
                                
                                {/* Notes */}
                                {transaction.notes && (
                                    <div className="mt-6 pt-6 border-t">
                                        <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                                        <div className="mt-2 p-3 bg-gray-50 rounded">{transaction.notes}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Transaction Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Item Transaksi</CardTitle>
                                <CardDescription>
                                    {(transaction.sales_items || []).length} item dalam transaksi ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead className="text-center">Jumlah</TableHead>
                                                <TableHead className="text-right">Harga Satuan</TableHead>
                                                <TableHead className="text-right">Diskon</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(transaction.sales_items || []).map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.product.name}</div>
                                                            <div className="text-sm text-muted-foreground">{item.product.sku}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(item.unit_price)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(item.discount_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        {formatCurrency(item.total_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary and Payments */}
                    <div className="space-y-6">
                        {/* Transaction Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan Transaksi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-mono">{formatCurrency(transaction.subtotal_amount)}</span>
                                </div>
                                {transaction.discount_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>Diskon Item:</span>
                                        <span className="font-mono">-{formatCurrency(transaction.discount_amount)}</span>
                                    </div>
                                )}
                                {transaction.customer_discount_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>Diskon Member ({transaction.customer_discount_percentage}%):</span>
                                        <span className="font-mono">-{formatCurrency(transaction.customer_discount_amount)}</span>
                                    </div>
                                )}
                                {transaction.additional_discount_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>Diskon Tambahan:</span>
                                        <span className="font-mono">-{formatCurrency(transaction.additional_discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Pajak:</span>
                                    <span className="font-mono">{formatCurrency(transaction.tax_amount)}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total:</span>
                                    <span className="font-mono">{formatCurrency(transaction.total_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dibayar:</span>
                                    <span className="font-mono">{formatCurrency(transaction.paid_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kembalian:</span>
                                    <span className="font-mono font-semibold text-green-600">
                                        {formatCurrency(transaction.change_amount)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Metode Pembayaran
                                </CardTitle>
                                <CardDescription>
                                    {(transaction.payments || []).length} metode pembayaran digunakan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(transaction.payments || []).map((payment) => (
                                        <div key={payment.id} className="flex justify-between items-start p-3 border rounded">
                                            <div>
                                                <div className="font-medium">{payment.payment_method.name}</div>
                                                <div className="text-sm text-muted-foreground">{payment.payment_method.type}</div>
                                                {payment.reference_number && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Ref: {payment.reference_number}
                                                    </div>
                                                )}
                                                {payment.fee_amount > 0 && (
                                                    <div className="text-sm text-red-600">
                                                        Biaya: {formatCurrency(payment.fee_amount)}
                                                    </div>
                                                )}
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDateTime(payment.created_at)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-semibold">{formatCurrency(payment.amount)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Dibuat:</span>
                                    <span>{formatDateTime(transaction.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Diperbarui:</span>
                                    <span>{formatDateTime(transaction.updated_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ID Transaksi:</span>
                                    <span className="font-mono">#{transaction.id}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Void Transaction Dialog */}
            <Dialog open={voidDialog} onOpenChange={setVoidDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan Transaksi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin membatalkan transaksi ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Nomor Transaksi:</span>
                                <span className="font-medium">{transaction.transaction_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah:</span>
                                <span className="font-medium">{formatCurrency(transaction.total_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal:</span>
                                <span className="font-medium">{formatDateTime(transaction.transaction_date)}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVoidDialog(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleVoidTransaction}>
                            Batalkan Transaksi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
