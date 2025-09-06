import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Package, Store } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';

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

interface InventoryData {
    id: number;
    store_id: number;
    product_id: number;
    quantity: number;
    minimum_stock: number;
    maximum_stock: number | null;
    average_cost: number;
    last_cost: number;
    location: string | null;
    last_restock_date: string | null;
    store: StoreData;
    product: ProductData;
}

interface Props {
    inventory: InventoryData;
    [key: string]: any;
}

export default function InventoryEdit() {
    const { inventory } = usePage<Props>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inventaris',
            href: '/inventory',
        },
        {
            title: 'Edit Stok',
            href: `/inventory/edit/${inventory.id}`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        minimum_stock: inventory.minimum_stock || 0,
        maximum_stock: inventory.maximum_stock || '',
        location: inventory.location || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/inventory/update/${inventory.id}`, {
            onSuccess: () => {
                router.visit('/inventory');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Stok - ${inventory.product.name}`} />

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
                        <div>
                            <CardTitle>Edit Pengaturan Stok</CardTitle>
                            <CardDescription>
                                Ubah pengaturan minimum stok, maksimum stok, dan lokasi penyimpanan
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Product and Store Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <Card className="border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Informasi Produk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Produk</label>
                                    <p className="font-semibold">{inventory.product.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kode</label>
                                    <p className="font-mono text-sm">{inventory.product.code}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                                    <p>{inventory.product.category.name}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Store className="h-4 w-4" />
                                    Informasi Toko
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Toko</label>
                                    <p className="font-semibold">{inventory.store.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Stok Saat Ini</label>
                                    <p className="text-2xl font-bold text-blue-500">{inventory.quantity}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
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
                                <p className="text-xs text-muted-foreground">
                                    Sistem akan memberikan notifikasi jika stok di bawah angka ini
                                </p>
                            </div>

                            {/* Maximum Stock */}
                            <div className="space-y-2">
                                <Label htmlFor="maximum_stock">Maximum Stok</Label>
                                <Input
                                    id="maximum_stock"
                                    type="number"
                                    min="0"
                                    value={data.maximum_stock}
                                    onChange={(e) => setData('maximum_stock', e.target.value)}
                                    placeholder="Masukkan maximum stok (opsional)"
                                    className={errors.maximum_stock ? 'border-destructive' : ''}
                                />
                                {errors.maximum_stock && (
                                    <p className="text-sm text-destructive">{errors.maximum_stock}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Kosongkan jika tidak ada batasan maksimum
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location">Lokasi Penyimpanan</Label>
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                placeholder="Contoh: Rak A-1, Gudang Utama, dll."
                                className={errors.location ? 'border-destructive' : ''}
                            />
                            {errors.location && (
                                <p className="text-sm text-destructive">{errors.location}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Informasi lokasi penyimpanan untuk memudahkan pencarian barang
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
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
