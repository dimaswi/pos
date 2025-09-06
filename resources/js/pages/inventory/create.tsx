import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save, Package, Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useForm } from '@inertiajs/react';

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
    barcode: string;
    category: CategoryData;
}

interface Props {
    stores: StoreData[];
    products: ProductData[];
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris',
        href: '/inventory',
    },
    {
        title: 'Tambah Produk ke Toko',
        href: '/inventory/create',
    },
];

export default function InventoryCreate() {
    const { stores, products } = usePage<Props>().props;
    
    const { data, setData, post, processing, errors } = useForm({
        store_id: '',
        product_id: '',
        quantity: 0,
        minimum_stock: 10,
        maximum_stock: null as number | null,
        location: '',
    });

    // Prepare options for searchable selects
    const storeOptions = stores.map(store => ({
        value: store.id.toString(),
        label: store.name
    }));

    const productOptions = products.map(product => ({
        value: product.id.toString(),
        label: `${product.name} (${product.code}) - ${product.category.name}`
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Produk ke Toko" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/inventory')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Plus className="h-6 w-6 text-green-500" />
                            <div>
                                <CardTitle>Tambah Produk ke Toko</CardTitle>
                                <CardDescription>
                                    Menambahkan produk baru ke inventaris toko dengan stok awal
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Store Selection */}
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

                            {/* Product Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="product_id">Produk *</Label>
                                <SearchableSelect
                                    value={data.product_id}
                                    onValueChange={(value: string) => setData('product_id', value)}
                                    options={productOptions}
                                    placeholder="Pilih produk"
                                    emptyText="Produk tidak ditemukan"
                                    className={errors.product_id ? 'border-destructive' : ''}
                                />
                                {errors.product_id && (
                                    <p className="text-sm text-destructive">{errors.product_id}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Initial Stock */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Stok Awal *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', parseInt(e.target.value) || 0)}
                                    placeholder="Masukkan stok awal"
                                    className={errors.quantity ? 'border-destructive' : ''}
                                />
                                {errors.quantity && (
                                    <p className="text-sm text-destructive">{errors.quantity}</p>
                                )}
                            </div>

                            {/* Minimum Stock */}
                            <div className="space-y-2">
                                <Label htmlFor="minimum_stock">Minimum Stok *</Label>
                                <Input
                                    id="minimum_stock"
                                    type="number"
                                    min="0"
                                    value={data.minimum_stock}
                                    onChange={(e) => setData('minimum_stock', parseInt(e.target.value) || 0)}
                                    placeholder="Masukkan minimum stok"
                                    className={errors.minimum_stock ? 'border-destructive' : ''}
                                />
                                {errors.minimum_stock && (
                                    <p className="text-sm text-destructive">{errors.minimum_stock}</p>
                                )}
                            </div>

                            {/* Maximum Stock */}
                            <div className="space-y-2">
                                <Label htmlFor="maximum_stock">Maximum Stok</Label>
                                <Input
                                    id="maximum_stock"
                                    type="number"
                                    min="0"
                                    value={data.maximum_stock || ''}
                                    onChange={(e) => setData('maximum_stock', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Masukkan maximum stok (opsional)"
                                    className={errors.maximum_stock ? 'border-destructive' : ''}
                                />
                                {errors.maximum_stock && (
                                    <p className="text-sm text-destructive">{errors.maximum_stock}</p>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location">Lokasi Penyimpanan</Label>
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                placeholder="Masukkan lokasi penyimpanan (misal: Rak A-1, Gudang B)"
                                className={errors.location ? 'border-destructive' : ''}
                            />
                            {errors.location && (
                                <p className="text-sm text-destructive">{errors.location}</p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                                <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Informasi:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Produk akan ditambahkan ke inventaris toko yang dipilih</li>
                                        <li>• Stok awal akan tercatat sebagai stock movement dengan tipe "adjustment"</li>
                                        <li>• Minimum stok digunakan untuk notifikasi stok menipis</li>
                                        <li>• Maximum stok membantu dalam perencanaan pembelian</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                Tambah ke Inventaris
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit('/inventory')}
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
