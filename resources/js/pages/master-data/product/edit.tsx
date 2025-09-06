import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';

interface CategoryData {
    id: number;
    name: string;
}

interface SupplierData {
    id: number;
    name: string;
}

interface ProductData {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    category_id: number;
    supplier_id?: number;
    unit: string;
    purchase_price: number;
    selling_price: number;
    minimum_price?: number;
    weight?: number;
    minimum_stock: number;
    is_track_stock: boolean;
    is_active: boolean;
    category: CategoryData;
    supplier?: SupplierData;
    current_stock?: number;
    inventories?: Array<{
        store_id: number;
        store_name: string;
        quantity: number;
        average_cost: number;
    }>;
}

interface Props {
    product: ProductData;
    categories: CategoryData[];
    suppliers: SupplierData[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Data',
        href: '/master-data',
    },
    {
        title: 'Produk',
        href: '/master-data/products',
    },
    {
        title: 'Edit',
        href: '',
    },
];

export default function ProductEdit({ product, categories, suppliers }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        category_id: product.category_id.toString() || '',
        supplier_id: product.supplier_id?.toString() || '',
        unit: product.unit || 'pcs',
        purchase_price: product.purchase_price.toString() || '',
        selling_price: product.selling_price.toString() || '',
        minimum_price: product.minimum_price?.toString() || '',
        weight: product.weight?.toString() || '',
        minimum_stock: product.minimum_stock.toString() || '',
        is_track_stock: product.is_track_stock ?? true,
        is_active: product.is_active ?? true,
    });

    // Prepare options for searchable selects
    const categoryOptions = [
        { value: 'none', label: 'Pilih Kategori' },
        ...categories.map(category => ({
            value: category.id.toString(),
            label: category.name
        }))
    ];

    const supplierOptions = [
        { value: 'none', label: 'Pilih Supplier' },
        ...suppliers.map(supplier => ({
            value: supplier.id.toString(),
            label: supplier.name
        }))
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master-data/products/${product.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Produk - ${product.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/master-data/products')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle className="text-2xl">Edit Produk</CardTitle>
                            <CardDescription>
                                Edit informasi produk {product.name}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Stock Summary */}
                    {product.is_track_stock && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-3">Ringkasan Stok</h4>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{product.current_stock || 0}</p>
                                    <p className="text-sm text-blue-700">Total Stok</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600">{product.minimum_stock}</p>
                                    <p className="text-sm text-orange-700">Stok Minimum</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${(product.current_stock || 0) <= product.minimum_stock ? 'text-red-600' : 'text-green-600'}`}>
                                        {(product.current_stock || 0) <= product.minimum_stock ? 'Perlu Restok' : 'Normal'}
                                    </p>
                                    <p className="text-sm text-gray-600">Status Stok</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-green-600">
                                        Rp {new Intl.NumberFormat('id-ID').format(
                                            product.inventories?.reduce((total, inv) => 
                                                total + (inv.quantity * (inv.average_cost || 0)), 0) || 0
                                        )}
                                    </p>
                                    <p className="text-sm text-green-700">Nilai Stok</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-900">Informasi Dasar</h3>
                                <p className="text-sm text-gray-600">Informasi dasar produk</p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Product Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Produk *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama produk"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* SKU */}
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        placeholder="Masukkan SKU produk"
                                        className={errors.sku ? 'border-destructive' : ''}
                                    />
                                    {errors.sku && (
                                        <p className="text-sm text-destructive">{errors.sku}</p>
                                    )}
                                </div>

                                {/* Barcode */}
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input
                                        id="barcode"
                                        value={data.barcode}
                                        onChange={(e) => setData('barcode', e.target.value)}
                                        placeholder="Masukkan barcode (opsional)"
                                        className={errors.barcode ? 'border-destructive' : ''}
                                    />
                                    {errors.barcode && (
                                        <p className="text-sm text-destructive">{errors.barcode}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Kategori *</Label>
                                    <SearchableSelect
                                        value={data.category_id || 'none'}
                                        onValueChange={(value) => setData('category_id', value === 'none' ? '' : value)}
                                        options={categoryOptions}
                                        placeholder="Pilih kategori"
                                        emptyText="Kategori tidak ditemukan"
                                        className={errors.category_id ? 'border-destructive' : ''}
                                    />
                                    {errors.category_id && (
                                        <p className="text-sm text-destructive">{errors.category_id}</p>
                                    )}
                                </div>

                                {/* Supplier */}
                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">Supplier</Label>
                                    <SearchableSelect
                                        value={data.supplier_id || 'none'}
                                        onValueChange={(value) => setData('supplier_id', value === 'none' ? '' : value)}
                                        options={supplierOptions}
                                        placeholder="Pilih supplier"
                                        emptyText="Supplier tidak ditemukan"
                                        className={errors.supplier_id ? 'border-destructive' : ''}
                                    />
                                    {errors.supplier_id && (
                                        <p className="text-sm text-destructive">{errors.supplier_id}</p>
                                    )}
                                </div>

                                {/* Unit */}
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Satuan *</Label>
                                    <Select value={data.unit} onValueChange={(value) => setData('unit', value)}>
                                        <SelectTrigger className={errors.unit ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Pilih satuan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                            <SelectItem value="gram">Gram (g)</SelectItem>
                                            <SelectItem value="liter">Liter (L)</SelectItem>
                                            <SelectItem value="ml">Mililiter (ml)</SelectItem>
                                            <SelectItem value="box">Box</SelectItem>
                                            <SelectItem value="pack">Pack</SelectItem>
                                            <SelectItem value="meter">Meter (m)</SelectItem>
                                            <SelectItem value="cm">Centimeter (cm)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.unit && (
                                        <p className="text-sm text-destructive">{errors.unit}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pricing Information */}
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-900">Informasi Harga</h3>
                                <p className="text-sm text-gray-600">Pengaturan harga produk</p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Purchase Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="purchase_price">Harga Beli *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                                        <Input
                                            id="purchase_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.purchase_price}
                                            onChange={(e) => setData('purchase_price', e.target.value)}
                                            placeholder="0"
                                            className={`pl-10 ${errors.purchase_price ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {errors.purchase_price && (
                                        <p className="text-sm text-destructive">{errors.purchase_price}</p>
                                    )}
                                </div>

                                {/* Selling Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="selling_price">Harga Jual *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                                        <Input
                                            id="selling_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.selling_price}
                                            onChange={(e) => setData('selling_price', e.target.value)}
                                            placeholder="0"
                                            className={`pl-10 ${errors.selling_price ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {errors.selling_price && (
                                        <p className="text-sm text-destructive">{errors.selling_price}</p>
                                    )}
                                </div>

                                {/* Minimum Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="minimum_price">Harga Minimum</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                                        <Input
                                            id="minimum_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.minimum_price}
                                            onChange={(e) => setData('minimum_price', e.target.value)}
                                            placeholder="0"
                                            className={`pl-10 ${errors.minimum_price ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {errors.minimum_price && (
                                        <p className="text-sm text-destructive">{errors.minimum_price}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stock & Physical Information */}
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-900">Informasi Stok & Fisik</h3>
                                <p className="text-sm text-gray-600">Pengaturan stok dan informasi fisik produk</p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {/* Minimum Stock */}
                                <div className="space-y-2">
                                    <Label htmlFor="minimum_stock">Stok Minimum *</Label>
                                    <Input
                                        id="minimum_stock"
                                        type="number"
                                        min="0"
                                        value={data.minimum_stock}
                                        onChange={(e) => setData('minimum_stock', e.target.value)}
                                        placeholder="0"
                                        className={errors.minimum_stock ? 'border-destructive' : ''}
                                    />
                                    {errors.minimum_stock && (
                                        <p className="text-sm text-destructive">{errors.minimum_stock}</p>
                                    )}
                                </div>

                                {/* Current Stock Info */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Stok Saat Ini</Label>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                                        <p className="text-sm text-blue-700 font-medium">
                                            Total: {product.current_stock || 0} {product.unit}
                                        </p>
                                        {product.inventories && product.inventories.length > 0 ? (
                                            <div className="space-y-1">
                                                {product.inventories.map((inv, index) => (
                                                    <div key={index} className="text-xs text-blue-600 flex justify-between">
                                                        <span>{inv.store_name}:</span>
                                                        <span>{inv.quantity} {product.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-blue-600">Belum ada stok</p>
                                        )}
                                        <p className="text-xs text-blue-600 pt-1 border-t border-blue-200">
                                            Gunakan menu Inventory untuk mengubah stok
                                        </p>
                                    </div>
                                </div>

                                {/* Average Cost Info */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Harga Pokok Rata-rata</Label>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
                                        {product.inventories && product.inventories.length > 0 ? (
                                            <div className="space-y-1">
                                                {product.inventories.map((inv, index) => (
                                                    <div key={index} className="text-xs text-green-600 flex justify-between">
                                                        <span>{inv.store_name}:</span>
                                                        <span>Rp {new Intl.NumberFormat('id-ID').format(inv.average_cost || 0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-green-700 font-medium">Belum ada data</p>
                                        )}
                                        <p className="text-xs text-green-600 pt-1 border-t border-green-200">
                                            Berdasarkan pembelian terakhir
                                        </p>
                                    </div>
                                </div>

                                {/* Weight */}
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Berat (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.weight}
                                        onChange={(e) => setData('weight', e.target.value)}
                                        placeholder="0.00"
                                        className={errors.weight ? 'border-destructive' : ''}
                                    />
                                    {errors.weight && (
                                        <p className="text-sm text-destructive">{errors.weight}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-900">Deskripsi</h3>
                                <p className="text-sm text-gray-600">Deskripsi detail produk</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi Produk</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                    placeholder="Masukkan deskripsi produk"
                                    className={errors.description ? 'border-destructive' : ''}
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-900">Pengaturan</h3>
                                <p className="text-sm text-gray-600">Pengaturan tambahan produk</p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50/50">
                                    <Checkbox
                                        id="is_track_stock"
                                        checked={data.is_track_stock}
                                        onCheckedChange={(checked) => setData('is_track_stock', checked as boolean)}
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="is_track_stock" className="font-medium">Lacak Stok</Label>
                                        <p className="text-sm text-gray-600">Aktifkan pelacakan stok untuk produk ini</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50/50">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="is_active" className="font-medium">Status Aktif</Label>
                                        <p className="text-sm text-gray-600">Produk dapat digunakan dalam transaksi</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6 border-t">
                            <Button type="submit" disabled={processing} className="min-w-[120px]">
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Mengupdate...' : 'Update Produk'}
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit('/master-data/products')}
                            >
                                Batal
                            </Button>
                            <Button 
                                variant="secondary" 
                                type="button"
                                onClick={() => router.visit(`/master-data/inventory?search=${product.sku}`)}
                                className="ml-auto"
                            >
                                <Package className="h-4 w-4 mr-2" />
                                Kelola Stok
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
