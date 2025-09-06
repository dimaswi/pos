import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Package, Plus, Save, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
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
    price: number;
    current_stock: number;
    category: CategoryData;
}

interface Props {
    stores: StoreData[];
    products: ProductData[];
}

interface AdjustmentItemForm {
    product_id: number | null;
    adjusted_quantity: number;
    notes: string;
    [key: string]: any;
}

interface FormData {
    store_id: string;
    type: 'increase' | 'decrease';
    reason:
        | 'stock_opname'
        | 'damaged_goods'
        | 'expired_goods'
        | 'lost_goods'
        | 'found_goods'
        | 'correction'
        | 'supplier_return'
        | 'customer_return'
        | 'other';
    adjustment_date: string;
    notes: string;
    items: AdjustmentItemForm[];
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'Stock Adjustments', href: '/inventory/stock-adjustments' },
    { title: 'Create', href: '#' },
];

export default function StockAdjustmentCreate({ stores, products }: Props) {
    const [formData, setFormData] = useState({
        store_id: '',
        type: 'increase' as 'increase' | 'decrease',
        reason: 'correction' as
            | 'stock_opname'
            | 'damaged_goods'
            | 'expired_goods'
            | 'lost_goods'
            | 'found_goods'
            | 'correction'
            | 'supplier_return'
            | 'customer_return'
            | 'other',
        adjustment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const [items, setItems] = useState<AdjustmentItemForm[]>([
        {
            product_id: null,
            adjusted_quantity: 0,
            notes: '',
        },
    ]);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const storeOptions = stores.map((store) => ({
        value: store.id.toString(),
        label: store.name,
    }));

    const productOptions = products.map((product) => ({
        value: product.id.toString(),
        label: `${product.name} (${product.code})`,
        category: product.category.name,
    }));

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

    const addItem = () => {
        const newItems = [
            ...items,
            {
                product_id: null,
                adjusted_quantity: 0,
                notes: '',
            },
        ];
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const updateItem = (index: number, field: keyof AdjustmentItemForm, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const getSelectedProduct = (productId: number | null) => {
        return products.find((p) => p.id === productId);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const calculateEstimatedValueImpact = () => {
        return items.reduce((total, item) => {
            const product = getSelectedProduct(item.product_id);
            if (!product || !item.adjusted_quantity || !product.price) return total;

            const impact = item.adjusted_quantity * product.price;
            return total + (formData.type === 'decrease' ? -Math.abs(impact) : Math.abs(impact));
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate items
        const validItems = items.filter((item) => item.product_id && item.adjusted_quantity !== 0);
        if (validItems.length === 0) {
            toast.error('Minimal harus ada 1 item dengan quantity yang valid');
            return;
        }

        setProcessing(true);
        setErrors({});

        const payload = {
            ...formData,
            items: validItems,
        };

        router.post('/inventory/stock-adjustments', payload, {
            onSuccess: () => {
                toast.success('Stock adjustment berhasil dibuat');
            },
            onError: (errors: any) => {
                console.log('Errors:', errors);
                setErrors(errors);
                toast.error('Gagal membuat stock adjustment');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Stock Adjustment" />

            <div className="">
                {/* Header */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Basic Information */}
                        <Card className='mt-6'>
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
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="store_id">Toko *</Label>
                                        <SearchableSelect
                                            value={formData.store_id}
                                            onValueChange={(value) => setFormData((prev) => ({ ...prev, store_id: value }))}
                                            options={storeOptions}
                                            placeholder="Pilih toko"
                                            emptyText="Toko tidak ditemukan"
                                        />
                                        {errors.store_id && <p className="text-sm text-red-600">{errors.store_id}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="adjustment_date">Tanggal Adjustment *</Label>
                                        <Input
                                            id="adjustment_date"
                                            type="date"
                                            value={formData.adjustment_date}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, adjustment_date: e.target.value }))}
                                        />
                                        {errors.adjustment_date && <p className="text-sm text-red-600">{errors.adjustment_date}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="type">Tipe Adjustment *</Label>
                                        <SearchableSelect
                                            value={formData.type}
                                            onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as 'increase' | 'decrease' }))}
                                            options={typeOptions}
                                            placeholder="Pilih tipe"
                                            emptyText="Tipe tidak ditemukan"
                                        />
                                        {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="reason">Alasan *</Label>
                                        <SearchableSelect
                                            value={formData.reason}
                                            onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value as any }))}
                                            options={reasonOptions}
                                            placeholder="Pilih alasan"
                                            emptyText="Alasan tidak ditemukan"
                                        />
                                        {errors.reason && <p className="text-sm text-red-600">{errors.reason}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Catatan tambahan..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                    />
                                    {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Items</CardTitle>
                                        <CardDescription>Produk yang akan disesuaikan</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Tambah Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                            <Package className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="mb-1 text-lg font-medium">Belum ada item</p>
                                        <p className="text-sm">Klik "Tambah Item" untuk memulai</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item, index) => (
                                            <div key={index} className="rounded-lg border bg-white p-4">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="font-medium">Item #{index + 1}</h4>
                                                    {items.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div>
                                                        <Label>Produk *</Label>
                                                        <SearchableSelect
                                                            value={item.product_id?.toString() || ''}
                                                            onValueChange={(value) => updateItem(index, 'product_id', parseInt(value))}
                                                            options={productOptions}
                                                            placeholder="Pilih produk"
                                                            emptyText="Produk tidak ditemukan"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Quantity {formData.type === 'increase' ? 'Ditambah' : 'Dikurangi'} *</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.adjusted_quantity || ''}
                                                            onChange={(e) => updateItem(index, 'adjusted_quantity', parseInt(e.target.value) || 0)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Catatan Item</Label>
                                                    <Textarea
                                                        value={item.notes}
                                                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                        placeholder="Catatan untuk item ini..."
                                                        rows={2}
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                {item.product_id && (
                                                    <div className="rounded bg-gray-50 p-3">
                                                        <div className="text-sm">
                                                            <p>
                                                                <strong>Kategori:</strong>{' '}
                                                                {getSelectedProduct(item.product_id)?.category?.name || '-'}
                                                            </p>
                                                            <p>
                                                                <strong>Current Stock:</strong>{' '}
                                                                {getSelectedProduct(item.product_id)?.current_stock || 0}
                                                            </p>
                                                            <p>
                                                                <strong>Harga:</strong>{' '}
                                                                {formatCurrency(getSelectedProduct(item.product_id)?.price || 0)}
                                                            </p>
                                                            <p>
                                                                <strong>Estimasi Impact:</strong>
                                                                <span
                                                                    className={`ml-1 font-medium ${
                                                                        formData.type === 'increase' ? 'text-green-600' : 'text-red-600'
                                                                    }`}
                                                                >
                                                                    {formatCurrency(
                                                                        (item.adjusted_quantity || 0) *
                                                                            (getSelectedProduct(item.product_id)?.price || 0),
                                                                    )}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <Card className='mt-6'>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Items</span>
                                        <span className="font-medium">
                                            {items.filter((item) => item.product_id && item.adjusted_quantity !== 0).length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tipe</span>
                                        <span className={`font-medium ${formData.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formData.type === 'increase' ? 'Penambahan' : 'Pengurangan'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Alasan</span>
                                        <span className="font-medium">
                                            {reasonOptions.find((r) => r.value === formData.reason)?.label || formData.reason}
                                        </span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Est. Value Impact</span>
                                            <span
                                                className={`font-medium ${calculateEstimatedValueImpact() >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {formatCurrency(calculateEstimatedValueImpact())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Help */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Tips</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-xs text-gray-600">
                                    <p>• Pastikan quantity yang diinput sudah benar</p>
                                    <p>• Pilih alasan yang sesuai untuk audit trail</p>
                                    <p>• Adjustment akan masuk status Draft dan perlu approval</p>
                                    <p>• Stok akan terupdate setelah approval</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t pt-6">
                    <Button variant="outline" onClick={() => router.visit('/inventory/stock-adjustments')} disabled={processing}>
                        Batal
                    </Button>

                    <Button onClick={handleSubmit} disabled={processing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Adjustment'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
