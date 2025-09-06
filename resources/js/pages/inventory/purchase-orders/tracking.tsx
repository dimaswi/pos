import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, CheckCircle, Clock, Calendar } from 'lucide-react';
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
    };
    quantity_ordered: number;
    quantity_received: number;
    quantity_remaining: number;
    unit_cost: number;
    total_cost: number;
}

interface ReceiveHistory {
    id: number;
    received_date: string;
    notes: string;
    items_received: Array<{
        item_id: number;
        quantity_received: number;
        product: {
            id: number;
            name: string;
            code: string;
        };
    }>;
    created_at: string;
    received_by: {
        id: number;
        name: string;
    };
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    status: string;
    store: {
        id: number;
        name: string;
    };
    supplier: {
        id: number;
        name: string;
        company_name: string;
    };
    order_date: string;
    expected_date: string;
    received_date: string;
    items: PurchaseOrderItem[];
    receive_history: ReceiveHistory[];
}

interface Props {
    purchaseOrder: PurchaseOrder;
}

export default function TrackingPage({ purchaseOrder }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Purchase Orders', href: '/inventory/purchase-orders' },
        { title: purchaseOrder.po_number, href: `/inventory/purchase-orders/${purchaseOrder.id}` },
        { title: 'Tracking', href: '#' },
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const calculateProgress = () => {
        const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity_ordered, 0);
        const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.quantity_received, 0);
        return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'received':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'partial_received':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tracking ${purchaseOrder.po_number}`} />

            <div className="max-w-7xl p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Tracking Progress</h1>
                            <p className="text-sm text-gray-500">{purchaseOrder.po_number} • {purchaseOrder.supplier.name}</p>
                        </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(purchaseOrder.status)}`}>
                        {purchaseOrder.status === 'received' ? 'Completed' : 'Partial Received'}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Progress Overview */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Card */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Overall Progress</h3>
                                <span className="text-2xl font-bold text-blue-600">{calculateProgress()}%</span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                <div 
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                                    style={{ width: `${calculateProgress()}%` }}
                                ></div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {purchaseOrder.items.reduce((sum, item) => sum + item.quantity_ordered, 0)}
                                    </p>
                                    <p className="text-sm text-gray-500">Total Ordered</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {purchaseOrder.items.reduce((sum, item) => sum + item.quantity_received, 0)}
                                    </p>
                                    <p className="text-sm text-gray-500">Received</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-600">
                                        {purchaseOrder.items.reduce((sum, item) => sum + item.quantity_remaining, 0)}
                                    </p>
                                    <p className="text-sm text-gray-500">Remaining</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Progress */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Items Progress</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {purchaseOrder.items.map((item) => {
                                    const progress = item.quantity_ordered > 0 ? (item.quantity_received / item.quantity_ordered) * 100 : 0;
                                    
                                    return (
                                        <div key={item.id} className="px-6 py-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.product.name}</p>
                                                        <p className="text-sm text-gray-500">{item.product.code}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-gray-500">
                                                        {item.quantity_received}/{item.quantity_ordered}
                                                    </span>
                                                    <span className="font-medium">
                                                        {Math.round(progress)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        progress === 100 ? 'bg-emerald-500' : 
                                                        progress > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                                    }`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Order Date</span>
                                    <span className="font-medium">{formatDate(purchaseOrder.order_date)}</span>
                                </div>
                                {purchaseOrder.expected_date && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Expected</span>
                                        <span className="font-medium">{formatDate(purchaseOrder.expected_date)}</span>
                                    </div>
                                )}
                                {purchaseOrder.received_date && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Completed</span>
                                        <span className="font-medium">{formatDate(purchaseOrder.received_date)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Value</span>
                                        <span className="font-medium">
                                            {formatCurrency(purchaseOrder.items.reduce((sum, item) => sum + item.total_cost, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {purchaseOrder.receive_history && purchaseOrder.receive_history.length > 0 ? (
                                    purchaseOrder.receive_history
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 5)
                                        .flatMap((history) => 
                                            history.items_received.map((item, itemIndex) => (
                                                <div key={`${history.id}-${itemIndex}`} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Received {item.quantity_received} units
                                                        </p>
                                                        <p className="text-xs text-gray-500">{item.product?.name || 'Unknown Product'}</p>
                                                        <p className="text-xs text-gray-400">{formatDate(history.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                        .slice(0, 5)
                                ) : (
                                    <div className="text-center py-4">
                                        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No activity yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed History */}
                {purchaseOrder.receive_history && purchaseOrder.receive_history.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Receive History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {purchaseOrder.receive_history
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .flatMap((history) => 
                                            history.items_received.map((item, itemIndex) => (
                                                <tr key={`${history.id}-${itemIndex}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {formatDate(history.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                                                            <p className="text-xs text-gray-500">{item.product?.code || '-'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                            +{item.quantity_received}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {history.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
