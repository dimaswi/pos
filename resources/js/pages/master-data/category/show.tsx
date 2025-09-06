import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit3, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';

interface CategoryData {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    parent_id?: number;
    parent?: {
        id: number;
        name: string;
    };
    children?: CategoryData[];
    products_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    category: CategoryData;
    [key: string]: any;
}

export default function CategoryShow({ category }: Props) {
    const { hasPermission } = usePermission();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Master Data',
            href: '/master-data',
        },
        {
            title: 'Kategori',
            href: '/master-data/categories',
        },
        {
            title: category.name,
            href: `/master-data/categories/${category.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Kategori - ${category.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.visit('/master-data/categories')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Detail Kategori</CardTitle>
                                <CardDescription>
                                    Informasi lengkap kategori {category.name}
                                </CardDescription>
                            </div>
                        </div>
                        
                        {hasPermission('category.edit') && (
                            <Button 
                                variant="outline"
                                onClick={() => router.visit(`/master-data/categories/${category.id}/edit`)}
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Kategori
                            </Button>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Dasar</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nama Kategori</label>
                                <p className="text-lg font-medium">{category.name}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Kode Kategori</label>
                                <p className="text-lg font-mono">{category.code}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                        {category.is_active ? 'Aktif' : 'Tidak Aktif'}
                                    </Badge>
                                </div>
                            </div>

                            {category.parent && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kategori Parent</label>
                                    <p className="text-lg">{category.parent.name}</p>
                                </div>
                            )}
                        </div>

                        {category.description && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                                <p className="text-base mt-1">{category.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Statistics */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Statistik</h3>
                        <div className="grid gap-6 md:grid-cols-3">
                            {category.products_count !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Jumlah Produk</label>
                                        <p className="text-2xl font-bold">{category.products_count}</p>
                                    </div>
                                </div>
                            )}

                            {category.children && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sub Kategori</label>
                                    <p className="text-2xl font-bold">{category.children.length}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sub Categories */}
                    {category.children && category.children.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Sub Kategori</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {category.children.map((child) => (
                                    <Card key={child.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">{child.name}</h4>
                                                <p className="text-sm text-muted-foreground">{child.code}</p>
                                            </div>
                                            <Badge variant={child.is_active ? 'default' : 'secondary'} className="text-xs">
                                                {child.is_active ? 'Aktif' : 'Tidak Aktif'}
                                            </Badge>
                                        </div>
                                        {child.description && (
                                            <p className="text-sm text-muted-foreground mt-2">{child.description}</p>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Sistem</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Dibuat Pada</label>
                                <p className="text-base">{new Date(category.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</label>
                                <p className="text-base">{new Date(category.updated_at).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
