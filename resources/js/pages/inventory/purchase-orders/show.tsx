import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { ArrowLeft, Edit, Calendar, Package, Building, User, FileText, CheckCircle, Truck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';

interface PurchaseOrderItem {
    id: number;
    product: {
        id: number;
        name: string;
        code: string;
        barcode: string;
    };
    quantity_ordered: number;
    quantity_received: number;
    quantity_remaining: number;
    unit_cost: number;
    total_cost: number;
    notes: string;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    status: 'pending' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled' | 'draft';
    store: {
        id: number;
        name: string;
    };
    supplier: {
        id: number;
        name: string;
        company_name: string;
        contact_person: string;
        phone: string;
        email: string;
    };
    order_date: string;
    expected_date: string;
    received_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    notes: string;
    created_by: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
    items: PurchaseOrderItem[];
}

interface Props {
    purchaseOrder: PurchaseOrder;
    [key: string]: any;
}

const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
    ordered: { label: 'Ordered', color: 'bg-purple-100 text-purple-800' },
    partial_received: { label: 'Partially Received', color: 'bg-orange-100 text-orange-800' },
    received: { label: 'Received', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
};

export default function PurchaseOrderShow() {
    const { purchaseOrder } = usePage<Props>().props;

    const handleApprove = () => {
        router.post(`/inventory/purchase-orders/${purchaseOrder.id}/approve`, {}, {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    const handleReject = () => {
        router.post(`/inventory/purchase-orders/${purchaseOrder.id}/reject`, {}, {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    const handleSubmitForApproval = () => {
        router.post(`/inventory/purchase-orders/${purchaseOrder.id}/submit`, {}, {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    const canEdit = ['pending', 'draft'].includes(purchaseOrder.status);
    const canSubmit = purchaseOrder.status === 'draft';
    const canApprove = purchaseOrder.status === 'pending';
    const canReceive = ['approved', 'ordered', 'partial_received'].includes(purchaseOrder.status);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inventaris',
            href: '/inventory',
        },
        {
            title: 'Purchase Orders',
            href: '/inventory/purchase-orders',
        },
        {
            title: purchaseOrder.po_number,
            href: `/inventory/purchase-orders/${purchaseOrder.id}`,
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateProgress = () => {
        const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity_ordered, 0);
        const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.quantity_received, 0);
        return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase Order ${purchaseOrder.po_number}`} />

            <div className="max-w-7xl p-6 space-y-6">
                {/* Minimalist Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit('/inventory/purchase-orders')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{purchaseOrder.po_number}</h1>
                            <p className="text-sm text-gray-500">{purchaseOrder.supplier.name}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Badge 
                            variant="secondary" 
                            className={`${statusConfig[purchaseOrder.status].color} border-0 px-3 py-1`}
                        >
                            {statusConfig[purchaseOrder.status].label}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                            {canSubmit && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                                            Submit
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Submit untuk Approval</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Purchase Order akan dikirim untuk persetujuan.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={handleSubmitForApproval}
                                                className="bg-amber-600 hover:bg-amber-700"
                                            >
                                                Submit
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            
                            <PermissionGate permission="purchase-order.approve">
                                {canApprove && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                Approve
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Konfirmasi Approval</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Purchase Order akan disetujui dan dapat dilanjutkan ke proses penerimaan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleApprove}
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    Approve
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </PermissionGate>
                            
                            <PermissionGate permission="purchase-order.reject">
                                {canApprove && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive">
                                                Reject
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Konfirmasi Reject</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Purchase Order akan ditolak dan tidak dapat dilanjutkan ke proses penerimaan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleReject}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Reject
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </PermissionGate>
                            
                            {canReceive && (
                                <Button 
                                    size="sm"
                                    onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}/receive`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Receive
                                </Button>
                            )}
                            
                            {(purchaseOrder.status === 'partial_received' || purchaseOrder.status === 'received') && (
                                <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}/tracking`)}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Tracking
                                </Button>
                            )}
                            
                            <PermissionGate permission="purchase-order.edit">
                                {canEdit && (
                                    <Button 
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}/edit`)}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit
                                    </Button>
                                )}
                            </PermissionGate>
                        </div>
                    </div>
                </div>

                {/* Clean Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Details */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Pesanan</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Tanggal Order</span>
                                    <p className="font-medium text-gray-900">{formatDate(purchaseOrder.order_date)}</p>
                                </div>
                                {purchaseOrder.expected_date && (
                                    <div>
                                        <span className="text-gray-500">Tanggal Diharapkan</span>
                                        <p className="font-medium text-gray-900">{formatDate(purchaseOrder.expected_date)}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500">Toko</span>
                                    <p className="font-medium text-gray-900">{purchaseOrder.store.name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Dibuat oleh</span>
                                    <p className="font-medium text-gray-900">{purchaseOrder.created_by.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Items ({purchaseOrder.items.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Diterima</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {purchaseOrder.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.product.name}</p>
                                                        <p className="text-sm text-gray-500">{item.product.code}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium">
                                                    {item.quantity_ordered}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={item.quantity_received > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                                                        {item.quantity_received}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-sm">
                                                    {formatCurrency(item.unit_cost)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-semibold">
                                                    {formatCurrency(item.total_cost)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.quantity_received === 0 && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {item.quantity_received > 0 && item.quantity_remaining > 0 && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                            Partial
                                                        </span>
                                                    )}
                                                    {item.quantity_remaining === 0 && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                            Complete
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Progress */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Penerimaan</span>
                                    <span className="font-medium">{calculateProgress()}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${calculateProgress()}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Info */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{purchaseOrder.supplier.name}</p>
                                    <p className="text-gray-500">{purchaseOrder.supplier.company_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Contact Person</p>
                                    <p className="font-medium text-gray-900">{purchaseOrder.supplier.contact_person}</p>
                                </div>
                                {purchaseOrder.supplier.phone && (
                                    <div>
                                        <p className="text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900">{purchaseOrder.supplier.phone}</p>
                                    </div>
                                )}
                                {purchaseOrder.supplier.email && (
                                    <div>
                                        <p className="text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900">{purchaseOrder.supplier.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ringkasan</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-mono">{formatCurrency(purchaseOrder.subtotal)}</span>
                                </div>
                                {purchaseOrder.discount_amount > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Diskon</span>
                                        <span className="font-mono">-{formatCurrency(purchaseOrder.discount_amount)}</span>
                                    </div>
                                )}
                                {purchaseOrder.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Pajak</span>
                                        <span className="font-mono">{formatCurrency(purchaseOrder.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span className="text-gray-900">Total</span>
                                        <span className="font-mono text-gray-900">{formatCurrency(purchaseOrder.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {purchaseOrder.notes && (
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Catatan</h3>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
