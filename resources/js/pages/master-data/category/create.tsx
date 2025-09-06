import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';

interface CategoryData {
    id: number;
    name: string;
}

interface Props {
    parentCategories: CategoryData[];
}

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
        title: 'Tambah',
        href: '/master-data/categories/create',
    },
];

export default function CategoryCreate({ parentCategories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        description: '',
        parent_id: '',
        is_active: true as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/master-data/categories');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kategori" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Link href="/master-data/categories">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <CardTitle className="text-2xl">Tambah Kategori</CardTitle>
                            <CardDescription>
                                Tambahkan kategori produk baru untuk mengorganisir inventori
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
                                    placeholder="Contoh: CAT001"
                                    className={errors.code ? 'border-destructive' : ''}
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">{errors.code}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-1">
                            {/* Parent Category */}
                            <div className="space-y-2">
                                <Label htmlFor="parent_id">Kategori Induk</Label>
                                <SearchableSelect
                                    value={data.parent_id || "none"}
                                    onValueChange={(value: string) => setData('parent_id', value === "none" ? "" : value)}
                                    options={[
                                        { value: "none", label: "Tidak Ada Induk" },
                                        ...parentCategories.map(category => ({
                                            value: category.id.toString(),
                                            label: category.name
                                        }))
                                    ]}
                                    placeholder="Pilih kategori induk (opsional)"
                                    emptyText="Kategori induk tidak ditemukan"
                                    className={errors.parent_id ? 'border-destructive' : ''}
                                />
                                {errors.parent_id && (
                                    <p className="text-sm text-destructive">{errors.parent_id}</p>
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
                                Tambah Kategori
                            </Button>
                            <Link href="/master-data/categories">
                                <Button variant="outline" type="button">
                                    Batal
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
