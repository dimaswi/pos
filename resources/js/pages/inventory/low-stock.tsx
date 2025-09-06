import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, AlertTriangle, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';

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
    stock_status: string;
    stock_value: number;
    store: StoreData;
    product: ProductData;
}

interface Props {
    lowStockItems: InventoryData[];
    stores: StoreData[];
    filters?: {
        store_id: string;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris',
        href: '/inventory',
    },
    {
        title: 'Stok Menipis',
        href: '/inventory/low-stock',
    },
];

export default function LowStockIndex() {
    const { lowStockItems, stores, filters: initialFilters } = usePage<Props>().props;
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');

    // Prepare options for searchable selects
    const storeOptions = [
        { value: 'all', label: 'Semua Toko' },
        ...stores.map(store => ({
            value: store.id.toString(),
            label: store.name
        }))
    ];

    const handleFilter = () => {
        router.get('/inventory/low-stock', {
            store_id: storeId === 'all' ? '' : storeId,
        }, {
            preserveState: true,
            replace: true,
        });
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stok Menipis" />

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
                            <AlertTriangle className="h-6 w-6 text-orange-500" />
                            <div>
                                <CardTitle>Stok Menipis</CardTitle>
                                <CardDescription>
                                    Item yang stoknya berada di bawah minimum atau habis
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Filter Section */}
                        <Card className="border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Filter Toko</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Toko</label>
                                        <SearchableSelect
                                            value={storeId}
                                            onValueChange={setStoreId}
                                            options={storeOptions}
                                            placeholder="Pilih toko"
                                            emptyText="Toko tidak ditemukan"
                                        />
                                    </div>
                                    
                                    <div className="flex items-end">
                                        <Button 
                                            onClick={handleFilter} 
                                            className="flex items-center gap-2"
                                        >
                                            <Package className="h-4 w-4" />
                                            Terapkan Filter
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="mt-6 w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Toko</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Stok Saat Ini</TableHead>
                                    <TableHead>Minimum Stok</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockItems.length > 0 ? (
                                    lowStockItems.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.product.code}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.store.name}</TableCell>
                                            <TableCell>{item.product.category.name}</TableCell>
                                            <TableCell>
                                                <span className={`font-bold ${
                                                    item.quantity <= 0 ? 'text-red-500' : 
                                                    item.quantity <= item.minimum_stock ? 'text-orange-500' : 'text-green-500'
                                                }`}>
                                                    {item.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.minimum_stock}</TableCell>
                                            <TableCell>
                                                {getStockBadge(item.stock_status)}
                                            </TableCell>
                                            <TableCell>{item.location || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-8 w-8 text-muted-foreground" />
                                                <p>Tidak ada produk dengan stok menipis.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
