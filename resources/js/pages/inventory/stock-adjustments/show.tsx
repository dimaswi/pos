import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Calendar, CheckCircle, Edit3, Package, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoreData {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
}

interface CategoryData {
    id: number;
    name: string;
}

interface ProductData {
    id: number;
    name: string;
    code: string;
    category: CategoryData;
}

interface StockAdjustmentItemData {
    id: number;
    product_id: number;
    current_quantity: number;
    adjusted_quantity: number;
    new_quantity: number;
    unit_cost: number;
    total_value_impact: number;
    notes: string | null;
    product: ProductData;
}

interface StockAdjustmentData {
    id: number;
    adjustment_number: string;
    store_id: number;
    type: string;
    reason: string;
    adjustment_date: string;
    status: string;
    total_value_impact: number;
    notes: string | null;
    created_at: string;
    approved_at: string | null;
    store: StoreData;
    created_by: UserData;
    approved_by: UserData | null;
    items: StockAdjustmentItemData[];
    formatted_type: string;
    formatted_reason: string;
}

interface Props {
    adjustment: StockAdjustmentData;
}

export default function StockAdjustmentShow({ adjustment }: Props) {
    const { hasPermission } = usePermission();
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Stock Adjustments', href: '/inventory/stock-adjustments' },
        { title: adjustment.adjustment_number, href: '#' },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null | undefined) => {
        const value = amount || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="outline">Draft</Badge>;
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                        Approved
                    </Badge>
                );
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        return type === 'increase' ? (
            <Badge variant="default" className="bg-emerald-100 text-emerald-700">
                <TrendingUp className="mr-1 h-3 w-3" />
                Penambahan
            </Badge>
        ) : (
            <Badge variant="default" className="bg-red-100 text-red-700">
                <TrendingDown className="mr-1 h-3 w-3" />
                Pengurangan
            </Badge>
        );
    };

    const handleApprove = () => {
        router.post(
            `/inventory/stock-adjustments/${adjustment.id}/approve`,
            {},
            {
                onSuccess: () => {
                    toast.success('Stock adjustment berhasil disetujui');
                },
                onError: () => {
                    toast.error('Gagal menyetujui stock adjustment');
                },
            },
        );
        setShowApproveDialog(false);
    };

    const handleReject = () => {
        router.post(
            `/inventory/stock-adjustments/${adjustment.id}/reject`,
            {},
            {
                onSuccess: () => {
                    toast.success('Stock adjustment berhasil ditolak');
                },
                onError: () => {
                    toast.error('Gagal menolak stock adjustment');
                },
            },
        );
        setShowRejectDialog(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Adjustment ${adjustment.adjustment_number}`} />
            <div className="space-y-6">
                {/* Items Section */}
                <Card className='mt-6'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit('/inventory/stock-adjustments')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    Stock Adjustment #{adjustment.adjustment_number}
                                </CardTitle>
                                <div className="flex items-center gap-3 mt-1">
                                    {getStatusBadge(adjustment.status)}
                                    <span className="text-gray-600 text-sm">
                                        Dibuat {formatDate(adjustment.created_at)}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">
                                        {adjustment.items.length} items
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Action Buttons */}
                            <PermissionGate permission="stock-adjustment.edit">
                                {adjustment.status === 'draft' && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => router.visit(`/inventory/stock-adjustments/${adjustment.id}/edit`)}
                                        className="flex items-center gap-2"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </Button>
                                )}
                            </PermissionGate>
                            
                            <PermissionGate permission="stock-adjustment.approve">
                                {adjustment.status === 'draft' && (
                                    <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                                        <AlertDialogTrigger asChild>
                                            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Approve Stock Adjustment</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin menyetujui stock adjustment ini? Stok akan langsung terupdate dan tidak bisa diubah lagi.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                                                    Yes, Approve
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </PermissionGate>

                            <PermissionGate permission="stock-adjustment.reject">
                                {adjustment.status === 'draft' && (
                                    <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Reject Stock Adjustment</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin menolak stock adjustment ini? Adjustment akan ditandai sebagai rejected dan stok tidak akan berubah.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                                                    Yes, Reject
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </PermissionGate>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {adjustment.items.map((item, index) => (
                                <Card key={item.id} className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                                                    {index + 1}
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900">{item.product.name}</h4>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {item.product.code}
                                            </Badge>
                                        </div>

                                        <div className="mb-4 text-sm text-gray-600">
                                            Kategori: <span className="font-medium">{item.product.category.name}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div className="rounded-lg bg-gray-50 p-3 text-center">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Stock</p>
                                                <p className="mt-1 text-2xl font-bold text-gray-900">{item.current_quantity.toLocaleString()}</p>
                                            </div>

                                            <div className="rounded-lg bg-blue-50 p-3 text-center">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adjustment</p>
                                                <div className="mt-1 flex items-center justify-center">
                                                    <Badge
                                                        variant={item.adjusted_quantity > 0 ? "default" : "destructive"}
                                                        className={`text-lg font-bold ${
                                                            item.adjusted_quantity > 0 
                                                                ? 'bg-emerald-100 text-emerald-700' 
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {item.adjusted_quantity > 0 && '+'}
                                                        {item.adjusted_quantity.toLocaleString()}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="rounded-lg bg-green-50 p-3 text-center">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">New Stock</p>
                                                <p className="mt-1 text-2xl font-bold text-green-700">{item.new_quantity.toLocaleString()}</p>
                                            </div>

                                            <div className="rounded-lg bg-purple-50 p-3 text-center">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Value Impact</p>
                                                <p 
                                                    className={`mt-1 text-lg font-bold ${
                                                        (item.total_value_impact || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {formatCurrency(item.total_value_impact || 0)}
                                                </p>
                                            </div>
                                        </div>

                                        {item.notes && (
                                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="mt-0.5 h-4 w-4 rounded-full bg-amber-400"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800">Catatan</p>
                                                        <p className="text-sm text-amber-700">{item.notes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card className="border-2 border-dashed border-gray-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Summary Adjustment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center">
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                                    <Package className="h-6 w-6 text-white" />
                                </div>
                                <p className="text-3xl font-bold text-blue-900">{adjustment.items.length}</p>
                                <p className="text-sm font-medium text-blue-700">Total Items</p>
                            </div>
                            
                            <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 text-center">
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                                <p className="text-3xl font-bold text-indigo-900">
                                    {adjustment.items.reduce((sum, item) => sum + Math.abs(item.adjusted_quantity), 0).toLocaleString()}
                                </p>
                                <p className="text-sm font-medium text-indigo-700">Total Quantity Adjusted</p>
                            </div>
                            
                            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center">
                                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                                    (adjustment.total_value_impact || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <p className={`text-3xl font-bold ${
                                    (adjustment.total_value_impact || 0) >= 0 ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {formatCurrency(adjustment.total_value_impact)}
                                </p>
                                <p className="text-sm font-medium text-purple-700">Total Value Impact</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Information */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Informasi Adjustment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-gray-50 p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adjustment Number</label>
                                <p className="mt-1 font-bold text-gray-900">{adjustment.adjustment_number}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toko</label>
                                <p className="mt-1 font-semibold text-gray-900">{adjustment.store.name}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipe & Alasan</label>
                                <div className="mt-2 flex items-center gap-2">
                                    {getTypeBadge(adjustment.type)}
                                    <span className="text-sm font-medium text-gray-700">• {adjustment.formatted_reason}</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tanggal Adjustment</label>
                                <p className="mt-1 font-semibold text-gray-900">{formatDate(adjustment.adjustment_date)}</p>
                            </div>
                            {adjustment.notes && (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                    <label className="text-xs font-medium text-amber-700 uppercase tracking-wide">Catatan</label>
                                    <p className="mt-1 text-sm text-amber-800">{adjustment.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-green-600" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Dibuat</p>
                                    <p className="text-sm text-gray-600">
                                        {formatDate(adjustment.created_at)} oleh <span className="font-medium">{adjustment.created_by.name}</span>
                                    </p>
                                </div>
                            </div>

                            {adjustment.approved_at && (
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                        adjustment.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        <div className={`h-3 w-3 rounded-full ${
                                            adjustment.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">
                                            {adjustment.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(adjustment.approved_at)} oleh <span className="font-medium">{adjustment.approved_by?.name}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                {adjustment.status === 'draft' && (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                                            <div>
                                                <p className="font-semibold text-yellow-800">Pending Approval</p>
                                                <p className="text-sm text-yellow-700">Stock adjustment belum disetujui. Stok belum terupdate.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adjustment.status === 'approved' && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
                                            <div>
                                                <p className="font-semibold text-green-800">Approved</p>
                                                <p className="text-sm text-green-700">Stock adjustment telah disetujui. Stok sudah terupdate.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adjustment.status === 'rejected' && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-red-500"></div>
                                            <div>
                                                <p className="font-semibold text-red-800">Rejected</p>
                                                <p className="text-sm text-red-700">Stock adjustment ditolak. Stok tidak berubah.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
