import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface StoreData {
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
    current_stock: number;
    price: number;
    category: CategoryData;
}

interface StockAdjustmentItemData {
    id?: number;
    product_id: number;
    current_quantity: number;
    adjusted_quantity: number;
    new_quantity: number;
    unit_cost: number;
    total_value_impact: number;
    notes: string;
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
    notes: string;
    store: StoreData;
    items: StockAdjustmentItemData[];
}

interface Props {
    adjustment: StockAdjustmentData;
    stores: StoreData[];
    products: ProductData[];
}

const typeOptions = [
    { value: 'increase', label: 'Penambahan Stok' },
    { value: 'decrease', label: 'Pengurangan Stok' },
];

const reasonOptions = [
    { value: 'stock_opname', label: 'Stock Opname' },
    { value: 'damaged_goods', label: 'Barang Rusak' },
    { value: 'expired_goods', label: 'Barang Kadaluarsa' },
    { value: 'lost_goods', label: 'Barang Hilang' },
    { value: 'found_goods', label: 'Barang Ditemukan' },
    { value: 'correction', label: 'Koreksi Data' },
    { value: 'supplier_return', label: 'Return ke Supplier' },
    { value: 'customer_return', label: 'Return dari Customer' },
    { value: 'other', label: 'Lainnya' },
];

export default function StockAdjustmentEdit({ adjustment, stores, products }: Props) {
    const [formData, setFormData] = useState({
        store_id: adjustment.store_id.toString(),
        type: adjustment.type,
        reason: adjustment.reason,
        adjustment_date: adjustment.adjustment_date.split('T')[0],
        notes: adjustment.notes || '',
    });

    const [items, setItems] = useState<StockAdjustmentItemData[]>(adjustment.items);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Stock Adjustments', href: '/inventory/stock-adjustments' },
        { title: adjustment.adjustment_number, href: `/inventory/stock-adjustments/${adjustment.id}` },
        { title: 'Edit', href: '#' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const calculateNewQuantity = (currentQty: number, adjustedQty: number) => {
        return currentQty + adjustedQty;
    };

    const calculateValueImpact = (adjustedQty: number, unitCost: number) => {
        return adjustedQty * unitCost;
    };

    const getSelectedProduct = (productId: number | null) => {
        return products.find(p => p.id === productId);
    };

    const addItem = () => {
        setItems([...items, {
            product_id: 0,
            current_quantity: 0,
            adjusted_quantity: 0,
            new_quantity: 0,
            unit_cost: 0,
            total_value_impact: 0,
            notes: '',
            product: {} as ProductData,
        }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        setItems(items.map((item, i) => {
            if (i !== index) return item;

            const updatedItem = { ...item, [field]: value };

            if (field === 'product_id') {
                const product = products.find(p => p.id === parseInt(value));
                if (product) {
                    updatedItem.product = product;
                    updatedItem.current_quantity = product.current_stock;
                    updatedItem.unit_cost = product.price;
                    updatedItem.new_quantity = calculateNewQuantity(product.current_stock, updatedItem.adjusted_quantity);
                    updatedItem.total_value_impact = calculateValueImpact(updatedItem.adjusted_quantity, product.price);
                }
            }

            if (field === 'adjusted_quantity') {
                const adjustedQty = parseInt(value) || 0;
                updatedItem.adjusted_quantity = adjustedQty;
                updatedItem.new_quantity = calculateNewQuantity(updatedItem.current_quantity, adjustedQty);
                updatedItem.total_value_impact = calculateValueImpact(adjustedQty, updatedItem.unit_cost);
            }

            return updatedItem;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const newErrors: Record<string, string> = {};
        
        if (!formData.store_id) newErrors.store_id = 'Store is required';
        if (!formData.type) newErrors.type = 'Type is required';
        if (!formData.reason) newErrors.reason = 'Reason is required';
        if (!formData.adjustment_date) newErrors.adjustment_date = 'Date is required';
        
        if (items.length === 0) {
            newErrors.items = 'At least one item is required';
        } else {
            items.forEach((item, index) => {
                if (!item.product_id) {
                    newErrors[`items.${index}.product_id`] = 'Product is required';
                }
                if (item.adjusted_quantity === 0) {
                    newErrors[`items.${index}.adjusted_quantity`] = 'Adjustment quantity cannot be zero';
                }
                if (item.new_quantity < 0) {
                    newErrors[`items.${index}.new_quantity`] = 'New quantity cannot be negative';
                }
            });
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix validation errors');
            return;
        }

        setIsSubmitting(true);
        
        const submitData = {
            ...formData,
            items: items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                adjusted_quantity: item.adjusted_quantity,
                notes: item.notes,
            }))
        };

        router.put(`/inventory/stock-adjustments/${adjustment.id}`, submitData, {
            onSuccess: () => {
                toast.success('Stock adjustment updated successfully');
                router.visit(`/inventory/stock-adjustments/${adjustment.id}`);
            },
            onError: (errors) => {
                setErrors(errors);
                toast.error('Failed to update stock adjustment');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const totalValueImpact = items.reduce((sum, item) => sum + item.total_value_impact, 0);

    // Check if adjustment is still editable
    if (adjustment.status !== 'draft') {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Stock Adjustment ${adjustment.adjustment_number}`} />
                
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Cannot Edit</h2>
                        <p className="text-yellow-700 mb-4">
                            Stock adjustment can only be edited when status is "Draft". 
                            Current status: <span className="font-semibold">{adjustment.status}</span>
                        </p>
                        <Button onClick={() => router.visit(`/inventory/stock-adjustments/${adjustment.id}`)}>
                            View Details
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Stock Adjustment ${adjustment.adjustment_number}`} />

            <div className="space-y-6">

                {/* Main Form */}
                <Card className="shadow-sm mt-6">
                     <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.visit('/inventory/stock-adjustments')}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Kembali
                                        </Button>
                                    </div>
                                    <div>
                                        <CardTitle>Buat Stock Adjustment</CardTitle>
                                        <CardDescription>Buat penyesuaian stok inventaris</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                    <CardContent>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="store_id">Store *</Label>
                                <Select
                                    value={formData.store_id}
                                    onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map((store) => (
                                            <SelectItem key={store.id} value={store.id.toString()}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.store_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.store_id}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="adjustment_date">Adjustment Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.adjustment_date}
                                    onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                                    className="mt-1"
                                />
                                {errors.adjustment_date && (
                                    <p className="text-red-500 text-sm mt-1">{errors.adjustment_date}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="type">Adjustment Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="reason">Reason *</Label>
                                <Select
                                    value={formData.reason}
                                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reasonOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.reason && (
                                    <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                placeholder="Additional notes for this adjustment..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Item Adjustment</CardTitle>
                                <Button
                                    type="button"
                                    onClick={addItem}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Item
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Package className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium mb-1">Belum ada item</p>
                                    <p className="text-sm">Klik "Tambah Item" untuk memulai</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={index} className="p-4 border rounded-lg bg-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">Item #{index + 1}</h4>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Product *</Label>
                                            <SearchableSelect
                                                options={products.map(product => ({
                                                    value: product.id.toString(),
                                                    label: `${product.name} (${product.code})`,
                                                    description: product.category.name,
                                                }))}
                                                value={item.product_id ? item.product_id.toString() : ''}
                                                onValueChange={(value: string) => updateItem(index, 'product_id', parseInt(value))}
                                                placeholder="Search product..."
                                            />
                                            {errors[`items.${index}.product_id`] && (
                                                <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.product_id`]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>Current Stock</Label>
                                            <Input
                                                type="number"
                                                value={item.current_quantity}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <Label>
                                                Adjustment Quantity *
                                            </Label>
                                            <Input
                                                type="number"
                                                value={item.adjusted_quantity || ''}
                                                onChange={(e) => updateItem(index, 'adjusted_quantity', parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                            {errors[`items.${index}.adjusted_quantity`] && (
                                                <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.adjusted_quantity`]}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>New Stock</Label>
                                            <Input
                                                type="number"
                                                value={item.new_quantity}
                                                disabled
                                                className={`bg-gray-50 ${item.new_quantity < 0 ? 'text-red-500' : ''}`}
                                            />
                                            {errors[`items.${index}.new_quantity`] && (
                                                <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.new_quantity`]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>Unit Cost</Label>
                                            <Input
                                                value={formatCurrency(item.unit_cost)}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <Label>Value Impact</Label>
                                            <Input
                                                value={formatCurrency(item.total_value_impact)}
                                                disabled
                                                className={`bg-gray-50 ${
                                                    item.total_value_impact >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            placeholder="Notes for this item..."
                                            value={item.notes}
                                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    {/* Product Info */}
                                    {item.product_id && (
                                        <div className="bg-gray-50 rounded p-3">
                                            <div className="text-sm space-y-1">
                                                <p><strong>Category:</strong> {getSelectedProduct(item.product_id)?.category?.name}</p>
                                                <p><strong>Current Stock:</strong> {item.current_quantity}</p>
                                                <p><strong>Unit Price:</strong> {formatCurrency(getSelectedProduct(item.product_id)?.price || 0)}</p>
                                                <p><strong>Estimated Impact:</strong> 
                                                    <span className={`font-medium ml-1 ${
                                                        item.total_value_impact >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {formatCurrency(item.total_value_impact)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            </div>
                        )}

                        {errors.items && (
                            <p className="text-sm text-red-600 mt-4">{errors.items}</p>
                        )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    {items.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                                    <p className="text-sm text-gray-500">Total Items</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {items.reduce((sum, item) => sum + Math.abs(item.adjusted_quantity), 0)}
                                    </p>
                                    <p className="text-sm text-gray-500">Total Quantity</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${
                                        totalValueImpact >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(totalValueImpact)}
                                    </p>
                                    <p className="text-sm text-gray-500">Total Value Impact</p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/inventory/stock-adjustments')}
                        disabled={isSubmitting}
                    >
                        Batal
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Memperbarui...' : 'Perbarui Adjustment'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
