import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Check, X, User, Store, Calendar, Receipt, Package, DollarSign } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/app-layout';
import PermissionGate from '@/components/permission-gate';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface ReturnItem {
    id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    refund_amount: number;
    reason: string;
    condition: string;
    condition_badge: {
        color: string;
        text: string;
    };
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

interface Store {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface SalesTransaction {
    id: number;
    transaction_number: string;
    customer?: Customer;
    store: Store;
    user: User;
}

interface SalesReturn {
    id: number;
    return_number: string;
    sales_transaction: SalesTransaction;
    store: Store;
    return_date: string;
    reason: string;
    refund_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    return_items: ReturnItem[];
    created_by?: User;
    processed_by?: User;
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

interface Props {
    return: SalesReturn;
}

export default function Show({ return: returnData }: Props) {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const handleApprove = () => {
        setIsApproving(true);
        router.post(route('sales.returns.approve', returnData.id), {}, {
            onSuccess: () => {
                toast.success('Retur berhasil disetujui');
            },
            onError: () => {
                toast.error('Gagal menyetujui retur');
            },
            onFinish: () => {
                setIsApproving(false);
            }
        });
    };

    const handleReject = () => {
        setIsRejecting(true);
        router.post(route('sales.returns.reject', returnData.id), {}, {
            onSuccess: () => {
                toast.success('Retur berhasil ditolak');
            },
            onError: () => {
                toast.error('Gagal menolak retur');
            },
            onFinish: () => {
                setIsRejecting(false);
            }
        });
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
            case 'good': return 'secondary';
            case 'damaged': return 'default';
            case 'defective': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Penjualan', href: '#' },
                { title: 'Retur', href: route('sales.returns.index') },
                { title: returnData.return_number, href: route('sales.returns.show', returnData.id) }
            ]}
        >
            <Head title={`Retur: ${returnData.return_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <PermissionGate permission="return.index">
                                <Link href={route('sales.returns.index')}>
                                    <Button variant="outline" size="sm">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Kembali
                                    </Button>
                                </Link>
                            </PermissionGate>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Detail Retur
                            </h2>
                        </div>
                        <div className="flex space-x-2">
                            <PermissionGate permission="return.edit">
                                <Link href={route('sales.returns.edit', returnData.id)}>
                                    <Button variant="outline">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                            </PermissionGate>
                            <PermissionGate permission="return.approve">
                                {returnData.status === 'pending' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="bg-green-600 hover:bg-green-700">
                                                <Check className="w-4 h-4 mr-2" />
                                                Setujui
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Setujui Retur</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin menyetujui retur ini? 
                                                    Setelah disetujui, barang akan dikembalikan ke stok dan refund akan diproses.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleApprove}
                                                    disabled={isApproving}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {isApproving ? 'Memproses...' : 'Setujui'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </PermissionGate>
                            
                            <PermissionGate permission="return.reject">
                                {returnData.status === 'pending' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">
                                                <X className="w-4 h-4 mr-2" />
                                                Tolak
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Tolak Retur</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin menolak retur ini? 
                                                    Setelah ditolak, permintaan retur tidak dapat diproses lagi.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleReject}
                                                    disabled={isRejecting}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    {isRejecting ? 'Memproses...' : 'Tolak'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </PermissionGate>
                        </div>
                    </div>

                    {/* Main Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Return Details */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl">{returnData.return_number}</CardTitle>
                                            <CardDescription>Detail Permintaan Retur</CardDescription>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(returnData.status)}>
                                            {returnData.status_badge?.text || 
                                             (returnData.status === 'pending' ? 'Pending' : 
                                              returnData.status === 'approved' ? 'Disetujui' : 'Ditolak')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                                <Receipt className="w-4 h-4 mr-1" />
                                                Transaksi Asli
                                            </h4>
                                            <p className="text-lg font-semibold">{returnData.sales_transaction.transaction_number}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Tanggal Retur
                                            </h4>
                                            <p className="text-lg">{new Date(returnData.return_date).toLocaleDateString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                                <Store className="w-4 h-4 mr-1" />
                                                Toko
                                            </h4>
                                            <p className="text-lg">{returnData.store.name}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                                                <User className="w-4 h-4 mr-1" />
                                                Pelanggan
                                            </h4>
                                            <p className="text-lg">{returnData.sales_transaction.customer?.name || 'Tamu'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Alasan Retur</h4>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{returnData.reason}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Return Items */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Package className="w-5 h-5 mr-2" />
                                        Barang Retur
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Jumlah</TableHead>
                                                <TableHead>Harga Satuan</TableHead>
                                                <TableHead>Kondisi</TableHead>
                                                <TableHead>Jumlah Refund</TableHead>
                                                <TableHead>Alasan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {returnData.return_items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.product.name}</TableCell>
                                                    <TableCell>{item.product.sku}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>Rp {Number(item.unit_price).toLocaleString('id-ID')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getConditionBadgeVariant(item.condition)}>
                                                            {item.condition_badge?.text || 
                                                             (item.condition === 'good' ? 'Baik' : 
                                                              item.condition === 'damaged' ? 'Rusak' : 'Cacat')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-semibold">Rp {Number(item.refund_amount).toLocaleString('id-ID')}</TableCell>
                                                    <TableCell className="max-w-xs truncate" title={item.reason}>
                                                        {item.reason}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Barang: <span className="font-semibold">{returnData.total_items}</span></p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold">Total Refund: <span className="text-green-600">Rp {Number(returnData.refund_amount).toLocaleString('id-ID')}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Status Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Status</span>
                                        <Badge variant={getStatusBadgeVariant(returnData.status)}>
                                            {returnData.status_badge?.text || 
                                             (returnData.status === 'pending' ? 'Menunggu' : 
                                              returnData.status === 'approved' ? 'Disetujui' : 'Ditolak')}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Dibuat</span>
                                        <span className="text-sm">{new Date(returnData.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    {returnData.created_by && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Dibuat Oleh</span>
                                            <span className="text-sm">{returnData.created_by.name}</span>
                                        </div>
                                    )}
                                    {returnData.processed_by && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Diproses Oleh</span>
                                            <span className="text-sm">{returnData.processed_by.name}</span>
                                        </div>
                                    )}
                                    {returnData.processed_at && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Diproses Pada</span>
                                            <span className="text-sm">{new Date(returnData.processed_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Transaction Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2" />
                                        Ringkasan Keuangan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Jumlah Barang</span>
                                        <span className="font-semibold">{returnData.total_items}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Jumlah Refund</span>
                                        <span className="font-semibold text-green-600">Rp {Number(returnData.refund_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total Refund</span>
                                        <span className="text-green-600">Rp {Number(returnData.refund_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Original Transaction */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transaksi Asli</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">No. Transaksi</span>
                                        <span className="text-sm font-mono">{returnData.sales_transaction.transaction_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Pelanggan</span>
                                        <span className="text-sm">{returnData.sales_transaction.customer?.name || 'Tamu'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Dilayani Oleh</span>
                                        <span className="text-sm">{returnData.sales_transaction.user.name}</span>
                                    </div>
                                    <div className="pt-2">
                                        <Link href={route('sales.transactions.show', returnData.sales_transaction.id)}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                Lihat Transaksi
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
