import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface CategoryData {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
}

interface Props {
    category: CategoryData;
    [key: string]: any;
}

export default function CategoryEdit({ category }: Props) {
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
            href: `/master-data/categories/${category.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        is_active: category.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master-data/categories/${category.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Kategori - ${category.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/master-data/categories')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Edit Kategori</CardTitle>
                            <CardDescription>
                                Perbarui informasi kategori produk
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Category Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Kategori *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Masukkan nama kategori"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Category Code */}
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Kategori *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="Masukkan kode kategori"
                                    className={errors.code ? 'border-destructive' : ''}
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">{errors.code}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                placeholder="Masukkan deskripsi kategori"
                                className={errors.description ? 'border-destructive' : ''}
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description}</p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active">Aktif</Label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                Perbarui Kategori
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit('/master-data/categories')}
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
