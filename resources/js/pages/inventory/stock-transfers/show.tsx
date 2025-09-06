import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit3, Check, X, Package, ArrowRightLeft, Calendar, User, FileText, Truck, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';

interface Product {
    id: number;
    name: string;
    code: string;
}

interface Store {
    id: number;
    name: string;
    address: string;
}

interface User {
    id: number;
    name: string;
}

interface StockTransferItem {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    received_quantity?: number;
    unit: string;
}

interface StockTransfer {
    id: number;
    reference_number: string;
    from_store_id: number;
    to_store_id: number;
    from_store: Store;
    to_store: Store;
    status: string;
    notes?: string;
    is_draft: boolean;
    items: StockTransferItem[];
    created_by: number;
    user: User;
    created_at: string;
    updated_at: string;
    approved_at?: string;
    shipped_at?: string;
    received_at?: string;
    cancelled_at?: string;
}

interface PageProps {
    stock_transfer: StockTransfer;
}

const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
    draft: 'Draft',
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    shipped: 'Dikirim',
    received: 'Diterima',
    cancelled: 'Dibatalkan',
};

export default function Show({ stock_transfer }: PageProps) {
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showShipDialog, setShowShipDialog] = useState(false);
    const [showReceiveDialog, setShowReceiveDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canEdit = stock_transfer.status === 'pending' || stock_transfer.status === 'draft';
    const canApprove = stock_transfer.status === 'pending';
    const canShip = stock_transfer.status === 'approved';
    const canReceive = stock_transfer.status === 'shipped';
    const canCancel = stock_transfer.status === 'pending' || stock_transfer.status === 'approved';

    const handleAction = async (action: string) => {
        setIsSubmitting(true);
        try {
            router.patch(`/inventory/stock-transfers/${stock_transfer.id}/${action}`, {}, {
                onSuccess: () => {
                    router.reload();
                },
                onFinish: () => {
                    setIsSubmitting(false);
                    setShowApproveDialog(false);
                    setShowRejectDialog(false);
                    setShowShipDialog(false);
                    setShowReceiveDialog(false);
                    setShowCancelDialog(false);
                }
            });
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID');
    };

    return (
        <AppLayout>
            <Head title={`Stock Transfer ${stock_transfer.reference_number}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit('/inventory/stock-transfers')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Stock Transfer #{stock_transfer.reference_number}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge className={statusColors[stock_transfer.status as keyof typeof statusColors]}>
                                    {statusLabels[stock_transfer.status as keyof typeof statusLabels]}
                                </Badge>
                                <span className="text-gray-600">
                                    Dibuat {formatDateTime(stock_transfer.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <PermissionGate permission="stock-transfer.edit">
                            {canEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.visit(`/inventory/stock-transfers/${stock_transfer.id}/edit`)}
                                    className="flex items-center gap-2"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                        </PermissionGate>
                        
                        <PermissionGate permission="stock-transfer.approve">
                            {canApprove && (
                                <Button
                                    onClick={() => setShowApproveDialog(true)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Check className="h-4 w-4" />
                                    Setujui
                                </Button>
                            )}
                        </PermissionGate>

                        <PermissionGate permission="stock-transfer.reject">
                            {canApprove && (
                                <Button
                                    onClick={() => setShowRejectDialog(true)}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                                >
                                    <X className="h-4 w-4" />
                                    Tolak
                                </Button>
                            )}
                        </PermissionGate>

                        {canShip && (
                            <Button
                                onClick={() => setShowShipDialog(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                                <Truck className="h-4 w-4" />
                                Kirim
                            </Button>
                        )}

                        {canReceive && (
                            <Button
                                onClick={() => setShowReceiveDialog(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Terima
                            </Button>
                        )}

                        {canCancel && (
                            <Button
                                variant="outline"
                                onClick={() => setShowCancelDialog(true)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="h-4 w-4" />
                                Batalkan
                            </Button>
                        )}
                    </div>
                </div>

                {/* Transfer Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowRightLeft className="h-5 w-5" />
                                Informasi Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Dari Gudang</label>
                                <p className="font-medium">{stock_transfer.from_store.name}</p>
                                <p className="text-sm text-gray-600">{stock_transfer.from_store.address}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ke Gudang</label>
                                <p className="font-medium">{stock_transfer.to_store.name}</p>
                                <p className="text-sm text-gray-600">{stock_transfer.to_store.address}</p>
                            </div>
                            {stock_transfer.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Catatan</label>
                                    <p className="text-sm">{stock_transfer.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                    <p className="font-medium">Dibuat</p>
                                    <p className="text-sm text-gray-600">
                                        {formatDateTime(stock_transfer.created_at)} oleh {stock_transfer.user.name}
                                    </p>
                                </div>
                            </div>
                            
                            {stock_transfer.approved_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Disetujui</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDateTime(stock_transfer.approved_at)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {stock_transfer.shipped_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Dikirim</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDateTime(stock_transfer.shipped_at)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {stock_transfer.received_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Diterima</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDateTime(stock_transfer.received_at)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {stock_transfer.cancelled_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Dibatalkan</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDateTime(stock_transfer.cancelled_at)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Item Transfer ({stock_transfer.items.length} item)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stock_transfer.items.map((item, index) => (
                                <div key={item.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Item #{index + 1}</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Produk</label>
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-600">{item.product.code}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Jumlah Dikirim</label>
                                            <p className="font-medium">{item.quantity} {item.unit}</p>
                                        </div>

                                        {item.received_quantity !== undefined && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Jumlah Diterima</label>
                                                <p className="font-medium">{item.received_quantity} {item.unit}</p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Satuan</label>
                                            <p className="font-medium">{item.unit}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Dialogs */}
                <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Setujui Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menyetujui transfer stok ini? Setelah disetujui, transfer dapat dikirim.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('approve')}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Ya, Setujui
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showShipDialog} onOpenChange={setShowShipDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Kirim Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin mengirim transfer stok ini? Item akan dikurangi dari gudang asal.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('ship')}
                                disabled={isSubmitting}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Ya, Kirim
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Terima Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menerima transfer stok ini? Item akan ditambahkan ke gudang tujuan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('receive')}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Ya, Terima
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tolak Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menolak transfer stok ini? Transfer akan ditandai sebagai rejected.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('reject')}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Ya, Tolak
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tolak Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menolak transfer stok ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('reject')}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Ya, Tolak
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tolak Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menolak transfer stok ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('reject')}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Ya, Tolak
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tolak Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menolak transfer stok ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('reject')}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Ya, Tolak
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Batalkan Transfer</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin membatalkan transfer stok ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleAction('cancel')}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Ya, Batalkan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
