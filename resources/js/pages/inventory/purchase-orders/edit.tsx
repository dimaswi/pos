import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';

interface StoreData {
    id: number;
    name: string;
}

interface SupplierData {
    id: number;
    name: string;
    company_name: string;
    contact_person: string;
}

interface CategoryData {
    id: number;
    name: string;
}

interface ProductData {
    id: number;
    name: string;
    code: string;
    barcode: string;
    purchase_price: number;
    category: CategoryData;
}

interface PurchaseOrderItem {
    id?: number;
    product_id: number;
    quantity_ordered: number;
    quantity_received?: number;
    unit_cost: number;
    total_cost: number;
    notes: string;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    status: 'pending' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled' | 'draft';
    store_id: number;
    supplier_id: number;
    order_date: string;
    expected_date: string;
    notes: string;
    items: PurchaseOrderItem[];
}

interface Props {
    purchaseOrder: PurchaseOrder;
    stores: StoreData[];
    suppliers: SupplierData[];
    products: ProductData[];
    [key: string]: any;
}

export default function PurchaseOrderEdit() {
    const { purchaseOrder, stores, suppliers, products } = usePage<Props>().props;
    
    // Helper function to format date for HTML input
    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return '';
        try {
            // Handle both YYYY-MM-DD and full datetime formats
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            // Format to YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            return '';
        }
    };
    
    const { data, setData, put, processing, errors } = useForm({
        store_id: purchaseOrder.store_id.toString(),
        supplier_id: purchaseOrder.supplier_id.toString(),
        order_date: formatDateForInput(purchaseOrder.order_date),
        expected_date: formatDateForInput(purchaseOrder.expected_date),
        notes: purchaseOrder.notes || '',
    });

    const [items, setItems] = useState<PurchaseOrderItem[]>(() => {
        return purchaseOrder.items?.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity_ordered: item.quantity_ordered || 0,
            quantity_received: item.quantity_received || 0,
            unit_cost: parseFloat(item.unit_cost?.toString() || '0'),
            total_cost: parseFloat(item.total_cost?.toString() || '0'),
            notes: item.notes || ''
        })) || [];
    });
    const [currentItem, setCurrentItem] = useState<PurchaseOrderItem>({
        product_id: 0,
        quantity_ordered: 1,
        unit_cost: 0,
        total_cost: 0,
        notes: '',
    });

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
        {
            title: 'Edit',
            href: `/inventory/purchase-orders/${purchaseOrder.id}/edit`,
        },
    ];

    // Prepare options for searchable selects
    const storeOptions = stores.map(store => ({
        value: store.id.toString(),
        label: store.name
    }));

    const supplierOptions = suppliers.map(supplier => ({
        value: supplier.id.toString(),
        label: `${supplier.name} - ${supplier.company_name}`
    }));

    const productOptions = products.map(product => ({
        value: product.id.toString(),
        label: `${product.name} (${product.code}) - ${product.category.name}`
    }));

    const handleAddItem = () => {
        if (!currentItem.product_id || currentItem.quantity_ordered <= 0 || currentItem.unit_cost <= 0) {
            return;
        }

        // Check if product already exists
        const existingIndex = items.findIndex(item => item.product_id === currentItem.product_id);
        
        if (existingIndex >= 0) {
            // Update existing item
            const updatedItems = [...items];
            updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                ...currentItem,
                total_cost: currentItem.quantity_ordered * currentItem.unit_cost
            };
            setItems(updatedItems);
        } else {
            // Add new item
            const newItem = {
                ...currentItem,
                total_cost: currentItem.quantity_ordered * currentItem.unit_cost
            };
            setItems([...items, newItem]);
        }

        // Reset current item
        setCurrentItem({
            product_id: 0,
            quantity_ordered: 1,
            unit_cost: 0,
            total_cost: 0,
            notes: '',
        });
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
    };

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id.toString() === productId);
        setCurrentItem(prev => ({
            ...prev,
            product_id: parseInt(productId),
            unit_cost: product ? product.purchase_price : 0,
            total_cost: prev.quantity_ordered * (product ? product.purchase_price : 0)
        }));
    };

    const handleQuantityChange = (quantity: number) => {
        setCurrentItem(prev => ({
            ...prev,
            quantity_ordered: quantity,
            total_cost: quantity * prev.unit_cost
        }));
    };

    const handleUnitCostChange = (cost: number) => {
        setCurrentItem(prev => ({
            ...prev,
            unit_cost: cost,
            total_cost: prev.quantity_ordered * cost
        }));
    };

    const getProductName = (productId: number) => {
        const product = products.find(p => p.id === productId);
        return product ? `${product.name} (${product.code})` : 'Product not found';
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.total_cost, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (items.length === 0) {
            alert('Silakan tambahkan minimal satu item');
            return;
        }
        
        // Convert items to expected format
        const formattedItems = items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity_ordered,
            unit_cost: item.unit_cost,
            notes: item.notes
        }));
        
        // Submit using router.put with combined data
        router.put(`/inventory/purchase-orders/${purchaseOrder.id}`, {
            ...data,
            items: formattedItems
        });
    };

    const canEdit = purchaseOrder.status === 'pending' || purchaseOrder.status === 'approved' || purchaseOrder.status === 'draft';

    if (!canEdit) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Purchase Order ${purchaseOrder.po_number}`} />

                <Card className='mt-6'>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Purchase Order tidak dapat diedit</CardTitle>
                                <CardDescription>
                                    Purchase Order dengan status '{purchaseOrder.status}' tidak dapat diedit
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Hanya Purchase Order dengan status 'Pending' atau 'Approved' yang dapat diedit.
                        </p>
                        <div className="mt-4">
                            <Button onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`)}>
                                Kembali ke Detail
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Purchase Order ${purchaseOrder.po_number}`} />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Edit className="h-6 w-6 text-blue-500" />
                            <div>
                                <CardTitle>Edit Purchase Order</CardTitle>
                                <CardDescription>
                                    Edit purchase order {purchaseOrder.po_number}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* PO Header */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="store_id">Toko *</Label>
                                <SearchableSelect
                                    value={data.store_id}
                                    onValueChange={(value: string) => setData('store_id', value)}
                                    options={storeOptions}
                                    placeholder="Pilih toko"
                                    emptyText="Toko tidak ditemukan"
                                    className={errors.store_id ? 'border-destructive' : ''}
                                />
                                {errors.store_id && (
                                    <p className="text-sm text-destructive">{errors.store_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplier_id">Supplier *</Label>
                                <SearchableSelect
                                    value={data.supplier_id}
                                    onValueChange={(value: string) => setData('supplier_id', value)}
                                    options={supplierOptions}
                                    placeholder="Pilih supplier"
                                    emptyText="Supplier tidak ditemukan"
                                    className={errors.supplier_id ? 'border-destructive' : ''}
                                />
                                {errors.supplier_id && (
                                    <p className="text-sm text-destructive">{errors.supplier_id}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="order_date">Tanggal Order *</Label>
                                <Input
                                    id="order_date"
                                    type="date"
                                    value={data.order_date}
                                    onChange={(e) => setData('order_date', e.target.value)}
                                    className={errors.order_date ? 'border-destructive' : ''}
                                />
                                {errors.order_date && (
                                    <p className="text-sm text-destructive">{errors.order_date}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expected_date">Tanggal Diharapkan</Label>
                                <Input
                                    id="expected_date"
                                    type="date"
                                    value={data.expected_date}
                                    onChange={(e) => setData('expected_date', e.target.value)}
                                    className={errors.expected_date ? 'border-destructive' : ''}
                                />
                                {errors.expected_date && (
                                    <p className="text-sm text-destructive">{errors.expected_date}</p>
                                )}
                            </div>
                        </div>

                        {/* Add Item Section */}
                        <Card className="border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Tambah Item</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-5">
                                    <div className="md:col-span-2">
                                        <Label>Produk *</Label>
                                        <SearchableSelect
                                            value={currentItem.product_id.toString()}
                                            onValueChange={handleProductChange}
                                            options={productOptions}
                                            placeholder="Pilih produk"
                                            emptyText="Produk tidak ditemukan"
                                        />
                                    </div>

                                    <div>
                                        <Label>Quantity *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={currentItem.quantity_ordered}
                                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                            placeholder="Qty"
                                        />
                                    </div>

                                    <div>
                                        <Label>Harga Satuan *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={currentItem.unit_cost}
                                            onChange={(e) => handleUnitCostChange(parseFloat(e.target.value) || 0)}
                                            placeholder="Harga"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="w-full"
                                            disabled={!currentItem.product_id || currentItem.quantity_ordered <= 0 || currentItem.unit_cost <= 0}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>

                                {currentItem.product_id ? (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm">
                                            Total: <span className="font-bold">{formatCurrency(currentItem.total_cost)}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Items List */}
                        {items.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Daftar Item ({items.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader className="bg-gray-100">
                                                <TableRow>
                                                    <TableHead>Produk</TableHead>
                                                    <TableHead>Qty Order</TableHead>
                                                    <TableHead>Qty Terima</TableHead>
                                                    <TableHead>Harga Satuan</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="w-[50px]">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{getProductName(item.product_id)}</p>
                                                                {item.notes && (
                                                                    <p className="text-sm text-gray-500">{item.notes}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">{item.quantity_ordered}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`font-medium ${item.quantity_received && item.quantity_received > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {item.quantity_received || '-'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-right">{formatCurrency(item.unit_cost)}</TableCell>
                                                        <TableCell className="font-mono font-bold text-right">{formatCurrency(item.total_cost)}</TableCell>
                                                        <TableCell>
                                                            {!item.quantity_received || item.quantity_received === 0 ? (
                                                                <Badge variant="outline" className="bg-gray-50 text-gray-600">Pending</Badge>
                                                            ) : item.quantity_received >= item.quantity_ordered ? (
                                                                <Badge className="bg-green-100 text-green-800">Complete</Badge>
                                                            ) : (
                                                                <Badge className="bg-orange-100 text-orange-800">Partial</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-600 hover:bg-red-50"
                                                                disabled={!!item.quantity_received}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 font-bold">
                                                    <TableCell colSpan={5}>Subtotal</TableCell>
                                                    <TableCell className="font-mono text-lg">{formatCurrency(calculateSubtotal())}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                placeholder="Catatan tambahan untuk purchase order ini"
                                rows={3}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={processing || items.length === 0}>
                                <Save className="h-4 w-4 mr-2" />
                                Update Purchase Order
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit(`/inventory/purchase-orders/${purchaseOrder.id}`)}
                            >
                                Batal
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
