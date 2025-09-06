import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Plus, Minus, CheckCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';

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
    items: PurchaseOrderItem[];
}

interface Props {
    purchaseOrder: PurchaseOrder;
}

export default function ReceivePage({ purchaseOrder }: Props) {
    const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Purchase Orders', href: '/inventory/purchase-orders' },
        { title: purchaseOrder.po_number, href: `/inventory/purchase-orders/${purchaseOrder.id}` },
        { title: 'Receive', href: '#' },
    ];

    // Initialize items with quantity_remaining if not present
    const items = purchaseOrder.items.map(item => ({
        ...item,
        quantity_remaining: item.quantity_remaining ?? (item.quantity_ordered - item.quantity_received)
    }));

    console.log('Available items:', items.map(i => ({ id: i.id, name: i.product.name })));

    const updateReceiveQuantity = (itemId: number, quantity: number) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            const validQuantity = Math.min(Math.max(0, quantity), item.quantity_remaining);
            setReceiveQuantities(prev => ({
                ...prev,
                [itemId]: validQuantity
            }));
        }
    };

    const receiveAllRemaining = () => {
        const newQuantities: Record<number, number> = {};
        items.forEach(item => {
            if (item.quantity_remaining > 0) {
                newQuantities[item.id] = item.quantity_remaining;
            }
        });
        setReceiveQuantities(newQuantities);
    };

    const hasChanges = Object.values(receiveQuantities).some(qty => qty > 0);
    const receivedItemsCount = items.filter(item => item.quantity_received > 0).length;
    const pendingItemsCount = items.filter(item => item.quantity_remaining > 0).length;

    const handleSaveReceive = () => {
        if (!hasChanges) {
            toast.error('Tidak ada item yang akan diterima');
            return;
        }

        setProcessing(true);

        const itemsToReceive = Object.entries(receiveQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, quantity]) => {
                const id = parseInt(itemId);
                console.log('Processing item:', { id, quantity, itemId });
                return {
                    id: id,
                    quantity_received: quantity
                };
            });

        if (itemsToReceive.length === 0) {
            toast.error('Tidak ada item yang valid untuk diterima');
            setProcessing(false);
            return;
        }

        const receiveData = {
            items: itemsToReceive,
            received_date: new Date().toISOString().split('T')[0],
            notes: ''
        };

        console.log('Sending receive data:', receiveData);

        router.post(`/inventory/purchase-orders/${purchaseOrder.id}/receive`, receiveData, {
            onSuccess: () => {
                toast.success('Penerimaan barang berhasil!', {
                    description: 'Item telah diterima dan stok telah diperbarui.',
                });
                
                setTimeout(() => {
                    router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`);
                }, 1500);
            },
            onError: (errors) => {
                console.error('Receive errors:', errors);
                
                let errorMessage = 'Silakan coba lagi.';
                if (typeof errors === 'object' && errors !== null) {
                    if (errors.message) {
                        errorMessage = errors.message;
                    } else if (errors.errors) {
                        const firstError = Object.values(errors.errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    } else {
                        errorMessage = JSON.stringify(errors);
                    }
                } else if (typeof errors === 'string') {
                    errorMessage = errors;
                }
                
                toast.error('Gagal memproses penerimaan', {
                    description: errorMessage,
                });
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Receive ${purchaseOrder.po_number}`} />
            <Toaster position="top-right" richColors />

            <div className="max-w-7xl p-6 space-y-6">
                {/* Minimalist Header */}
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
                            <h1 className="text-2xl font-semibold text-gray-900">Receive Items</h1>
                            <p className="text-sm text-gray-500">{purchaseOrder.po_number} • {purchaseOrder.supplier.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Progress Indicator */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span>{receivedItemsCount} received</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <span>{pendingItemsCount} pending</span>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={receiveAllRemaining}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Receive All
                        </Button>
                        
                        <Button
                            onClick={handleSaveReceive}
                            disabled={!hasChanges || processing}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="col-span-4">Product</div>
                            <div className="col-span-2 text-center">Ordered</div>
                            <div className="col-span-2 text-center">Received</div>
                            <div className="col-span-2 text-center">Remaining</div>
                            <div className="col-span-2 text-center">Receive Now</div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    {/* Product Info */}
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Package className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                                <p className="text-sm text-gray-500">{item.product.code}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ordered Quantity */}
                                    <div className="col-span-2 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-8 bg-gray-100 rounded-md text-sm font-medium text-gray-900">
                                            {item.quantity_ordered}
                                        </div>
                                    </div>

                                    {/* Received Quantity */}
                                    <div className="col-span-2 text-center">
                                        <div className={`inline-flex items-center justify-center w-16 h-8 rounded-md text-sm font-medium ${
                                            item.quantity_received > 0 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {item.quantity_received}
                                        </div>
                                    </div>

                                    {/* Remaining Quantity */}
                                    <div className="col-span-2 text-center">
                                        <div className={`inline-flex items-center justify-center w-16 h-8 rounded-md text-sm font-medium ${
                                            item.quantity_remaining > 0 
                                                ? 'bg-amber-100 text-amber-700' 
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {item.quantity_remaining}
                                        </div>
                                    </div>

                                    {/* Receive Input */}
                                    <div className="col-span-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateReceiveQuantity(item.id, Math.max(0, (receiveQuantities[item.id] || 0) - 1))}
                                                disabled={!receiveQuantities[item.id] || receiveQuantities[item.id] <= 0}
                                                className="w-8 h-8 p-0 border-gray-300"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.quantity_remaining}
                                                value={receiveQuantities[item.id] || 0}
                                                onChange={(e) => updateReceiveQuantity(item.id, parseInt(e.target.value) || 0)}
                                                className="w-16 h-8 text-center border border-gray-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateReceiveQuantity(item.id, (receiveQuantities[item.id] || 0) + 1)}
                                                disabled={receiveQuantities[item.id] >= item.quantity_remaining}
                                                className="w-8 h-8 p-0 border-gray-300"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        
                                        {item.quantity_remaining > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => updateReceiveQuantity(item.id, item.quantity_remaining)}
                                                className="mt-1 text-xs text-blue-600 hover:text-blue-700 h-6"
                                            >
                                                Receive All
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Footer */}
                    {hasChanges && (
                        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-blue-700">
                                    <strong>{Object.values(receiveQuantities).reduce((sum, qty) => sum + qty, 0)}</strong> items ready to receive
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReceiveQuantities({})}
                                        className="text-gray-600 hover:text-gray-700"
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        onClick={handleSaveReceive}
                                        disabled={processing}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {processing ? 'Processing...' : 'Confirm Receive'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {items.filter(item => item.quantity_remaining > 0).length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">All Items Received</h3>
                        <p className="text-gray-500 mb-6">All items in this purchase order have been fully received.</p>
                        <Button
                            onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`)}
                            variant="outline"
                        >
                            Back to Purchase Order
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
