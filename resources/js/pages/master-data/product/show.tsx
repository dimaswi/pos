import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit3, Package, ShoppingCart, BarChart3, TrendingUp } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import PermissionGate from '@/components/permission-gate';

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
    created_at: string;
    updated_at: string;
    current_stock?: number;
}

interface StockData {
    total_quantity: number;
    total_value: number;
    average_cost: number;
    inventories: Array<{
        store_id: number;
        store_name: string;
        quantity: number;
        average_cost: number;
        minimum_stock: number;
        stock_value: number;
    }>;
}

interface Props {
    product: ProductData;
    stock: StockData;
    recent_purchases?: Array<{
        date: string;
        quantity: number;
        unit_cost: number;
        supplier_name?: string;
    }>;
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
        title: 'Detail',
        href: '',
    },
];

export default function ProductShow({ product, stock }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Produk - ${product.name}`} />

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
                        <div className="flex-1">
                            <CardTitle className="text-2xl">{product.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <span>SKU: {product.sku}</span>
                                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                    {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                                </Badge>
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <PermissionGate permission="product.update">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => router.visit(`/master-data/products/${product.id}/edit`)}
                                >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </PermissionGate>
                            <PermissionGate permission="inventory.view">
                                <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => router.visit(`/master-data/inventory?search=${product.sku}`)}
                                >
                                    <Package className="h-4 w-4 mr-2" />
                                    Kelola Stok
                                </Button>
                            </PermissionGate>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Stock Overview Cards */}
                    {product.is_track_stock && (
                        <div className="grid gap-4 md:grid-cols-4 mb-8">
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{stock?.total_quantity || 0}</div>
                                    <div className="text-sm text-blue-700">Total Stok</div>
                                </CardContent>
                            </Card>
                            <Card className="border-orange-200 bg-orange-50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">{product.minimum_stock}</div>
                                    <div className="text-sm text-orange-700">Stok Minimum</div>
                                </CardContent>
                            </Card>
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-lg font-bold text-green-600">
                                        {formatCurrency(stock?.total_value || 0)}
                                    </div>
                                    <div className="text-sm text-green-700">Nilai Stok</div>
                                </CardContent>
                            </Card>
                            <Card className={`border-2 ${(stock?.total_quantity || 0) <= product.minimum_stock ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                                <CardContent className="p-4 text-center">
                                    <div className={`text-lg font-bold ${(stock?.total_quantity || 0) <= product.minimum_stock ? 'text-red-600' : 'text-green-600'}`}>
                                        {(stock?.total_quantity || 0) <= product.minimum_stock ? 'Perlu Restok' : 'Normal'}
                                    </div>
                                    <div className="text-sm text-gray-600">Status</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Informasi Dasar
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="grid gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Nama Produk</label>
                                        <p className="text-sm font-semibold">{product.name}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">SKU</label>
                                            <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{product.sku}</p>
                                        </div>
                                        
                                        {product.barcode && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Barcode</label>
                                                <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{product.barcode}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">Kategori</label>
                                            <p className="text-sm">{product.category.name}</p>
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">Satuan</label>
                                            <p className="text-sm">{product.unit}</p>
                                        </div>
                                    </div>
                                    
                                    {product.supplier && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">Supplier</label>
                                            <p className="text-sm">{product.supplier.name}</p>
                                        </div>
                                    )}

                                    {product.description && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">Deskripsi</label>
                                            <p className="text-sm text-gray-700 line-clamp-2">{product.description}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Price Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Informasi Harga
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0">
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                                        <span className="text-blue-700 font-medium">Harga Beli</span>
                                        <span className="font-bold text-blue-600">
                                            {formatCurrency(product.purchase_price)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                                        <span className="text-green-700 font-medium">Harga Jual</span>
                                        <span className="font-bold text-green-600">
                                            {formatCurrency(product.selling_price)}
                                        </span>
                                    </div>
                                    
                                    {product.minimum_price && (
                                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded text-sm">
                                            <span className="text-orange-700 font-medium">Harga Minimum</span>
                                            <span className="font-bold text-orange-600">
                                                {formatCurrency(product.minimum_price)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded text-sm">
                                        <div>
                                            <div className="text-purple-700 font-medium">Margin</div>
                                            <div className="text-xs text-purple-600">
                                                {((product.selling_price - product.purchase_price) / product.purchase_price * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <span className="font-bold text-purple-600">
                                            {formatCurrency(product.selling_price - product.purchase_price)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stock Value Information */}
                        {product.is_track_stock && stock?.inventories && stock.inventories.length > 0 && (
                            <Card className="xl:col-span-1">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Nilai Modal & Potensi Jual
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {stock.inventories.map((inv, index) => {
                                            const nilaiModal = inv.quantity * (inv.average_cost || 0);
                                            const potensiJual = inv.quantity * product.selling_price;
                                            const estimasiProfit = potensiJual - nilaiModal;
                                            
                                            return (
                                                <div key={index} className="p-3 border rounded bg-gray-50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-semibold text-gray-800">{inv.store_name}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {inv.quantity} {product.unit}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div className="text-center p-2 bg-blue-50 rounded">
                                                            <p className="text-blue-600 font-medium">Modal</p>
                                                            <p className="font-bold text-blue-700">
                                                                {formatCurrency(nilaiModal)}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="text-center p-2 bg-green-50 rounded">
                                                            <p className="text-green-600 font-medium">Potensi</p>
                                                            <p className="font-bold text-green-700">
                                                                {formatCurrency(potensiJual)}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className={`text-center p-2 rounded ${estimasiProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                                            <p className={`font-medium ${estimasiProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                Profit
                                                            </p>
                                                            <p className={`font-bold ${estimasiProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                {formatCurrency(estimasiProfit)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Compact Total Summary */}
                                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded">
                                            <h6 className="text-sm font-bold text-gray-800 mb-2 text-center">Total</h6>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="text-center">
                                                    <p className="font-bold text-blue-600">
                                                        {formatCurrency(
                                                            stock.inventories.reduce((total: number, inv) => 
                                                                total + (inv.quantity * (inv.average_cost || 0)), 0)
                                                        )}
                                                    </p>
                                                    <p className="text-blue-700">Modal</p>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <p className="font-bold text-green-600">
                                                        {formatCurrency(
                                                            stock.inventories.reduce((total: number, inv) => 
                                                                total + (inv.quantity * product.selling_price), 0)
                                                        )}
                                                    </p>
                                                    <p className="text-green-700">Potensi</p>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <p className="font-bold text-purple-600">
                                                        {formatCurrency(
                                                            stock.inventories.reduce((total: number, inv) => 
                                                                total + ((inv.quantity * product.selling_price) - (inv.quantity * (inv.average_cost || 0))), 0)
                                                        )}
                                                    </p>
                                                    <p className="text-purple-700">Profit</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stock Information */}
                        {product.is_track_stock && stock?.inventories && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Stok per Toko
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        {stock.inventories.map((inventory, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                                                <div>
                                                    <p className="font-medium">{inventory.store_name}</p>
                                                    <p className="text-xs text-gray-600">Min: {inventory.minimum_stock}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{inventory.quantity} {product.unit}</p>
                                                    <p className="text-xs text-gray-600">
                                                        {formatCurrency(inventory.average_cost)} / {product.unit}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Settings & Status */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Pengaturan & Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="grid gap-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Status Produk</span>
                                        <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs">
                                            {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Tracking Stok</span>
                                        <Badge variant={product.is_track_stock ? 'default' : 'secondary'} className="text-xs">
                                            {product.is_track_stock ? 'Ya' : 'Tidak'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Stok Minimum</span>
                                        <span className="font-medium">{product.minimum_stock} {product.unit}</span>
                                    </div>
                                    
                                    {product.weight && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Berat</span>
                                            <span className="font-medium">{product.weight} kg</span>
                                        </div>
                                    )}
                                    
                                    <div className="pt-2 border-t space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Dibuat</span>
                                            <span>{formatDate(product.created_at)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Diperbarui</span>
                                            <span>{formatDate(product.updated_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
