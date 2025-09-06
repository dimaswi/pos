import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, ArrowRightLeft, Plus, Trash2, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
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
    sku: string;
    category: CategoryData;
    price: number;
    current_stock: number;
}

interface TransferItem {
    id: string;
    product_id: number;
    product: ProductData | null;
    quantity: number;
    available_stock: number;
}

interface Props {
    stores: StoreData[];
    products: ProductData[];
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'Stock Transfers', href: '/inventory/stock-transfers' },
    { title: 'Create Transfer', href: '/inventory/stock-transfers/create' },
];

export default function CreateStockTransfer() {
    const { stores, products } = usePage<Props>().props;
    
    const [formData, setFormData] = useState({
        from_store_id: '',
        to_store_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: '',
    });
    
    const [items, setItems] = useState<TransferItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);

    // Filter products based on from_store_id
    useEffect(() => {
        if (formData.from_store_id) {
            setFilteredProducts(products);
        } else {
            setFilteredProducts([]);
        }
    }, [formData.from_store_id, products]);

    const storeOptions = stores.map(store => ({
        value: store.id.toString(),
        label: store.name
    }));

    const productOptions = filteredProducts.map(product => ({
        value: product.id.toString(),
        label: `${product.name} (${product.sku}) - Stok: ${product.current_stock}`,
        product: product
    }));

    const addNewItem = () => {
        const newItem: TransferItem = {
            id: Date.now().toString(),
            product_id: 0,
            product: null,
            quantity: 1,
            available_stock: 0,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof TransferItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                if (field === 'product_id') {
                    const selectedProduct = filteredProducts.find(p => p.id === parseInt(value));
                    return {
                        ...item,
                        product_id: parseInt(value) || 0,
                        product: selectedProduct || null,
                        available_stock: selectedProduct?.current_stock || 0,
                        quantity: Math.min(item.quantity, selectedProduct?.current_stock || 0)
                    };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const calculateTotalValue = () => {
        return items.reduce((total, item) => {
            if (item.product) {
                return total + (item.quantity * item.product.price);
            }
            return total;
        }, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const validateForm = () => {
        if (!formData.from_store_id) {
            toast.error('Pilih toko asal');
            return false;
        }
        if (!formData.to_store_id) {
            toast.error('Pilih toko tujuan');
            return false;
        }
        if (formData.from_store_id === formData.to_store_id) {
            toast.error('Toko asal dan tujuan tidak boleh sama');
            return false;
        }
        if (!formData.transfer_date) {
            toast.error('Pilih tanggal transfer');
            return false;
        }
        if (items.length === 0) {
            toast.error('Tambahkan minimal satu item');
            return false;
        }
        
        const invalidItems = items.filter(item => 
            !item.product_id || 
            item.quantity <= 0 || 
            item.quantity > item.available_stock
        );
        
        if (invalidItems.length > 0) {
            toast.error('Periksa kembali item yang ditambahkan. Pastikan produk dipilih dan quantity valid.');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        const submitData = {
            ...formData,
            items: items.map(item => ({
                product_id: item.product_id,
                quantity_requested: item.quantity,
                unit_cost: item.product?.price || 0,
            })),
            status: isDraft ? 'draft' : 'pending',
        };
        
        try {
            await router.post('/inventory/stock-transfers', submitData, {
                onSuccess: () => {
                    toast.success(`Stock Transfer berhasil ${isDraft ? 'disimpan sebagai draft' : 'dibuat'}`);
                    router.visit('/inventory/stock-transfers');
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    toast.error('Terjadi kesalahan validasi. Periksa kembali data yang dimasukkan.');
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan stock transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Stock Transfer Baru" />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/inventory/stock-transfers')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft className="h-6 w-6 text-blue-500" />
                            <div>
                                <CardTitle>Buat Stock Transfer Baru</CardTitle>
                                <CardDescription>
                                    Transfer produk antar toko untuk pemerataan stok inventaris
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="from_store_id">Dari Toko *</Label>
                                <SearchableSelect
                                    value={formData.from_store_id}
                                    onValueChange={(value) => {
                                        setFormData(prev => ({ ...prev, from_store_id: value }));
                                        setItems([]); // Reset items when store changes
                                    }}
                                    options={storeOptions}
                                    placeholder="Pilih toko asal"
                                    emptyText="Toko tidak ditemukan"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to_store_id">Ke Toko *</Label>
                                <SearchableSelect
                                    value={formData.to_store_id}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, to_store_id: value }))}
                                    options={storeOptions.filter(store => store.value !== formData.from_store_id)}
                                    placeholder="Pilih toko tujuan"
                                    emptyText="Toko tidak ditemukan"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transfer_date">Tanggal Transfer *</Label>
                                <Input
                                    id="transfer_date"
                                    type="date"
                                    value={formData.transfer_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, transfer_date: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Catatan transfer (opsional)"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Items Transfer</Label>
                                <Button
                                    type="button"
                                    onClick={addNewItem}
                                    disabled={!formData.from_store_id}
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Item
                                </Button>
                            </div>

                            {items.length > 0 && (
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-medium text-gray-900">{items.length}</div>
                                            <div className="text-gray-500">Total Items</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-gray-900">
                                                {items.reduce((sum, item) => sum + item.quantity, 0)}
                                            </div>
                                            <div className="text-gray-500">Total Quantity</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-blue-600">
                                                {formatCurrency(calculateTotalValue())}
                                            </div>
                                            <div className="text-gray-500">Total Value</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-green-600">Draft</div>
                                            <div className="text-gray-500">Status</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {items.length > 0 ? (
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="p-4 border rounded-lg bg-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">Item #{index + 1}</h4>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label>Produk *</Label>
                                                    <SearchableSelect
                                                        value={item.product_id.toString()}
                                                        onValueChange={(value) => updateItem(item.id, 'product_id', value)}
                                                        options={productOptions}
                                                        placeholder="Pilih produk"
                                                        emptyText="Produk tidak ditemukan"
                                                    />
                                                    {item.product && (
                                                        <p className="text-xs text-gray-500">
                                                            SKU: {item.product.sku} | Kategori: {item.product.category?.name}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label>Stok Tersedia</Label>
                                                    <div className="p-2 bg-gray-50 rounded border text-center">
                                                        <span className="font-medium text-lg">
                                                            {item.available_stock}
                                                        </span>
                                                        <p className="text-xs text-gray-500">unit</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label>Quantity Transfer *</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={item.available_stock}
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {item.product && (
                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Harga Satuan:</span>
                                                        <span className="font-medium">{formatCurrency(item.product.price)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Total Value:</span>
                                                        <span className="font-bold text-blue-600">
                                                            {formatCurrency(item.quantity * item.product.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">Belum ada item yang ditambahkan</p>
                                    <p className="text-sm">Pilih toko asal terlebih dahulu, lalu klik "Tambah Item"</p>
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                                <ArrowRightLeft className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Informasi Transfer:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Transfer akan mengurangi stok dari toko asal dan menambah stok ke toko tujuan</li>
                                        <li>• Stok yang ditransfer tidak boleh melebihi stok tersedia di toko asal</li>
                                        <li>• Transfer akan tercatat dalam stock movement untuk audit trail</li>
                                        <li>• Status draft dapat diedit, setelah disubmit memerlukan approval</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={isSubmitting}
                                variant="outline"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Simpan Draft
                            </Button>
                            <Button
                                type="button"
                                onClick={(e) => handleSubmit(e, false)}
                                disabled={isSubmitting}
                            >
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Buat Transfer
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit('/inventory/stock-transfers')}
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
