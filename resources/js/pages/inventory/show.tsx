import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Store, Calendar, MapPin, Edit3 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';

interface StoreData {
    id: number;
    name: string;
    address: string;
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
    description: string;
    unit: string;
    selling_price: number;
    purchase_price: number;
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
    stock_status: string;
    stock_value: number;
    store: StoreData;
    product: ProductData;
    created_at: string;
    updated_at: string;
}

interface Props {
    inventory: InventoryData;
    [key: string]: any;
}

export default function InventoryShow() {
    const { inventory } = usePage<Props>().props;
    const { hasPermission } = usePermission();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inventaris',
            href: '/inventory',
        },
        {
            title: 'Detail Stok',
            href: `/inventory/show/${inventory.id}`,
        },
    ];

    const getStockBadge = (stockStatus: string) => {
        switch (stockStatus) {
            case 'out_of_stock':
                return <Badge variant="destructive">Habis</Badge>;
            case 'low_stock':
                return <Badge variant="secondary">Menipis</Badge>;
            default:
                return <Badge variant="default">Aman</Badge>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Stok - ${inventory.product.name}`} />

            <div className="space-y-6">
                {/* Header */}
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
                                <Package className="h-6 w-6 text-blue-500" />
                                <div>
                                    <CardTitle>Detail Stok Inventaris</CardTitle>
                                    <CardDescription>
                                        Informasi lengkap stok produk di toko
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <PermissionGate permission="inventory.edit">
                                    <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2"
                                        onClick={() => router.visit(`/inventory/edit/${inventory.id}`)}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Informasi Produk
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nama Produk</label>
                                <p className="text-lg font-semibold">{inventory.product.name}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kode Produk</label>
                                    <p className="font-mono text-sm">{inventory.product.code}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                                    <p className="font-mono text-sm">{inventory.product.barcode}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                                <p>{inventory.product.category.name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Unit</label>
                                <p>{inventory.product.unit}</p>
                            </div>

                            {inventory.product.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                                    <p className="text-sm">{inventory.product.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Store Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Informasi Toko
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nama Toko</label>
                                <p className="text-lg font-semibold">{inventory.store.name}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                                <p className="text-sm">{inventory.store.address}</p>
                            </div>

                            {inventory.location && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Lokasi Penyimpanan</label>
                                    <p className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {inventory.location}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stock Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Stok Saat Ini</p>
                                <p className={`text-3xl font-bold ${
                                    inventory.quantity <= 0 ? 'text-red-500' : 
                                    inventory.quantity <= inventory.minimum_stock ? 'text-orange-500' : 'text-green-500'
                                }`}>
                                    {inventory.quantity}
                                </p>
                                <p className="text-xs text-muted-foreground">{inventory.product.unit}</p>
                            </div>

                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Minimum Stok</p>
                                <p className="text-3xl font-bold text-blue-500">{inventory.minimum_stock}</p>
                                <p className="text-xs text-muted-foreground">{inventory.product.unit}</p>
                            </div>

                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Maximum Stok</p>
                                <p className="text-3xl font-bold text-gray-500">
                                    {inventory.maximum_stock || '-'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {inventory.maximum_stock ? inventory.product.unit : 'Tidak dibatasi'}
                                </p>
                            </div>

                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Status Stok</p>
                                <div className="mt-2">
                                    {getStockBadge(inventory.stock_status)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Finansial</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Harga Beli</p>
                                <p className="text-xl font-bold text-blue-500">
                                    {formatCurrency(inventory.product.purchase_price)}
                                </p>
                            </div>

                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Harga Jual</p>
                                <p className="text-xl font-bold text-green-500">
                                    {formatCurrency(inventory.product.selling_price)}
                                </p>
                            </div>

                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Biaya Rata-rata</p>
                                <p className="text-xl font-bold text-purple-500">
                                    {formatCurrency(inventory.average_cost)}
                                </p>
                            </div>

                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">Nilai Stok</p>
                                <p className="text-xl font-bold text-orange-500">
                                    {formatCurrency(inventory.quantity * inventory.average_cost)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Terakhir Restock</label>
                                <p className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    {inventory.last_restock_date 
                                        ? formatDate(inventory.last_restock_date)
                                        : 'Belum pernah restock'
                                    }
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</label>
                                <p className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(inventory.updated_at)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
