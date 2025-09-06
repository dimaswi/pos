import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useForm } from '@inertiajs/react';
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

interface Props {
    stores: StoreData[];
    suppliers: SupplierData[];
    products: ProductData[];
    [key: string]: any;
}

interface PurchaseOrderItem {
    product_id: string;
    quantity_ordered: number;
    unit_cost: number;
    total_cost: number;
    notes: string;
}

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
        title: 'Buat PO',
        href: '/inventory/purchase-orders/create',
    },
];

export default function PurchaseOrderCreate() {
    const { stores, suppliers, products } = usePage<Props>().props;
    
    const { data, setData, post, processing, errors, reset } = useForm({
        store_id: '',
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        notes: '',
        items: [] as any[],
    });

    const [items, setItems] = useState<PurchaseOrderItem[]>([]);

    const [currentItem, setCurrentItem] = useState<PurchaseOrderItem>({
        product_id: '',
        quantity_ordered: 1,
        unit_cost: 0,
        total_cost: 0,
        notes: '',
    });

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
            product_id: '',
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
            product_id: productId,
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

    const getProductName = (productId: string) => {
        const product = products.find(p => p.id.toString() === productId);
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
        
        // Prepare data for submission
        const submitData = {
            ...data,
            items: formattedItems
        };
        
        console.log('Submitting data:', submitData);
        
        // Submit using router.post
        router.post('/inventory/purchase-orders', submitData);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Purchase Order" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/inventory/purchase-orders')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6 text-blue-500" />
                            <div>
                                <CardTitle>Buat Purchase Order</CardTitle>
                                <CardDescription>
                                    Buat pesanan pembelian baru dari supplier
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
                                            value={currentItem.product_id}
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

                                {currentItem.product_id && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm">
                                            Total: <span className="font-bold">{formatCurrency(currentItem.total_cost)}</span>
                                        </p>
                                    </div>
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
                                                    <TableHead>Quantity</TableHead>
                                                    <TableHead>Harga Satuan</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead className="w-[50px]">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{getProductName(item.product_id)}</TableCell>
                                                        <TableCell>{item.quantity_ordered}</TableCell>
                                                        <TableCell className="font-mono">{formatCurrency(item.unit_cost)}</TableCell>
                                                        <TableCell className="font-mono font-bold">{formatCurrency(item.total_cost)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 font-bold">
                                                    <TableCell colSpan={3}>Subtotal</TableCell>
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
                                Simpan Purchase Order
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit('/inventory/purchase-orders')}
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
