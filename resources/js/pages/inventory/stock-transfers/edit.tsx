import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AlertCircle, Plus, Save, Trash2, ArrowRightLeft, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';

interface Product {
    id: number;
    name: string;
    code: string;
    inventory?: {
        id: number;
        quantity: number;
        unit: string;
    };
}

interface Store {
    id: number;
    name: string;
    address: string;
}

interface StockTransferItem {
    id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    received_quantity?: number;
    unit: string;
}

interface StockTransfer {
    id: number;
    reference_number: string;
    from_store_id: number;
    to_store_id: number;
    status: string;
    notes?: string;
    is_draft: boolean;
    items: StockTransferItem[];
    created_at: string;
    updated_at: string;
}

interface PageProps {
    stock_transfer: StockTransfer;
    stores: Store[];
    products: Product[];
}

interface FormItem {
    id: number;
    product_id: number;
    quantity: number;
    unit: string;
    product?: Product;
}

export default function Edit({ stock_transfer, stores, products }: PageProps) {
    const [formData, setFormData] = useState({
        from_store_id: stock_transfer.from_store_id.toString(),
        to_store_id: stock_transfer.to_store_id.toString(),
        notes: stock_transfer.notes || '',
    });

    const [items, setItems] = useState<FormItem[]>(
        stock_transfer.items.map(item => ({
            id: Date.now() + Math.random(),
            product_id: item.product_id,
            quantity: item.quantity,
            unit: item.unit,
            product: item.product
        }))
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter products berdasarkan store yang dipilih
    const availableProducts = products.filter(product => 
        product.inventory && product.inventory.quantity > 0
    );

    const getAvailableStock = (productId: number) => {
        const product = availableProducts.find(p => p.id === productId);
        return product?.inventory?.quantity || 0;
    };

    const addNewItem = () => {
        setItems(prev => [...prev, {
            id: Date.now(),
            product_id: 0,
            quantity: 1,
            unit: '',
            product: undefined
        }]);
    };

    const removeItem = (id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const updateItem = (id: number, field: string, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                
                if (field === 'product_id') {
                    const product = availableProducts.find(p => p.id === value);
                    updatedItem.product = product;
                    updatedItem.unit = product?.inventory?.unit || '';
                }
                
                return updatedItem;
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const submitData = {
                ...formData,
                is_draft: isDraft,
                items: items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit: item.unit
                }))
            };

            router.patch(`/inventory/stock-transfers/${stock_transfer.id}`, submitData, {
                onSuccess: () => {
                    router.visit('/inventory/stock-transfers');
                },
                onError: (errors) => {
                    setErrors(errors);
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Submit error:', error);
            setIsSubmitting(false);
        }
    };

    const canEdit = stock_transfer.status === 'pending' || stock_transfer.status === 'draft';

    return (
        <AppLayout>
            <Head title="Edit Stock Transfer" />
            
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
                            <h1 className="text-2xl font-bold text-gray-900">Edit Stock Transfer</h1>
                            <p className="text-gray-600 mt-1">
                                Perbarui transfer stok #{stock_transfer.reference_number}
                            </p>
                        </div>
                    </div>
                </div>

                {!canEdit && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-800">Transfer tidak dapat diedit</p>
                                <p className="text-yellow-700 text-sm">
                                    Transfer dengan status "{stock_transfer.status}" tidak dapat diubah.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Info */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">Informasi Transfer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="from_store">Dari Gudang *</Label>
                                <Select 
                                    value={formData.from_store_id} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, from_store_id: value }))}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Pilih gudang asal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map((store) => (
                                            <SelectItem key={store.id} value={store.id.toString()}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.from_store_id && (
                                    <p className="text-sm text-red-600">{errors.from_store_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to_store">Ke Gudang *</Label>
                                <Select 
                                    value={formData.to_store_id} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, to_store_id: value }))}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Pilih gudang tujuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.filter(store => store.id.toString() !== formData.from_store_id).map((store) => (
                                            <SelectItem key={store.id} value={store.id.toString()}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.to_store_id && (
                                    <p className="text-sm text-red-600">{errors.to_store_id}</p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Catatan transfer (opsional)"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="bg-white"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Section */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Item Transfer</CardTitle>
                            {canEdit && (
                                <Button
                                    onClick={addNewItem}
                                    disabled={!formData.from_store_id}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Item
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-lg font-medium mb-1">Belum ada item</p>
                                <p className="text-sm">Klik "Tambah Item" untuk memulai</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="p-4 border rounded-lg bg-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-medium">Item #{index + 1}</h4>
                                            {canEdit && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Produk *</Label>
                                                <SearchableSelect
                                                    value={item.product_id.toString()}
                                                    onValueChange={(value) => updateItem(item.id, 'product_id', parseInt(value))}
                                                    placeholder="Pilih produk..."
                                                    options={availableProducts.map(product => ({
                                                        value: product.id.toString(),
                                                        label: `${product.name} (${product.code})`,
                                                        description: `Stok: ${product.inventory?.quantity || 0} ${product.inventory?.unit || ''}`
                                                    }))}
                                                />
                                                {errors[`items.${index}.product_id`] && (
                                                    <p className="text-sm text-red-600">{errors[`items.${index}.product_id`]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Jumlah *</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={getAvailableStock(item.product_id)}
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="bg-white"
                                                    disabled={!canEdit}
                                                />
                                                {getAvailableStock(item.product_id) > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        Stok tersedia: {getAvailableStock(item.product_id)} {item.unit}
                                                    </p>
                                                )}
                                                {errors[`items.${index}.quantity`] && (
                                                    <p className="text-sm text-red-600">{errors[`items.${index}.quantity`]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Satuan</Label>
                                                <Input
                                                    value={item.unit}
                                                    readOnly
                                                    placeholder="Pilih produk dulu"
                                                    className="bg-gray-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.items && (
                            <p className="text-sm text-red-600 mt-4">{errors.items}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                {canEdit && (
                    <div className="flex items-center justify-between pt-6 border-t">
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/inventory/stock-transfers')}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={isSubmitting || items.length === 0}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                Simpan Draft
                            </Button>
                            <Button
                                onClick={(e) => handleSubmit(e, false)}
                                disabled={isSubmitting || items.length === 0}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="h-4 w-4" />
                                Perbarui Transfer
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
