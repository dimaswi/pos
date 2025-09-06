import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Percent } from 'lucide-react';

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
    minimum_purchase: number;
    maximum_discount: number | null;
    is_active: boolean;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface FormData {
    name: string;
    discount_percentage: string;
    minimum_purchase: string;
    maximum_discount: string;
    description: string;
    is_active: boolean;
    [key: string]: any;
}

interface Props {
    customerDiscount: CustomerDiscount;
}

export default function Edit({ customerDiscount }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Master Data',
            href: '/master-data',
        },
        {
            title: 'Jenis Member',
            href: '/master-data/customer-discounts',
        },
        {
            title: `Edit ${customerDiscount.name}`,
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: customerDiscount.name,
        discount_percentage: customerDiscount.discount_percentage.toString(),
        minimum_purchase: customerDiscount.minimum_purchase.toString(),
        maximum_discount: customerDiscount.maximum_discount?.toString() || '',
        description: customerDiscount.description || '',
        is_active: customerDiscount.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/master-data/customer-discounts/${customerDiscount.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${customerDiscount.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/master-data/customer-discounts')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Percent className="h-5 w-5" />
                                Edit Jenis Member
                            </CardTitle>
                            <CardDescription>
                                Perbarui informasi jenis member: {customerDiscount.name}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Jenis Member</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">
                                        Nama Jenis Member <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama jenis member"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Discount Percentage */}
                                <div className="space-y-2">
                                    <Label htmlFor="discount_percentage">
                                        Persentase Diskon (%) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="discount_percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={data.discount_percentage}
                                        onChange={(e) => setData('discount_percentage', e.target.value)}
                                        placeholder="0.00"
                                        className={errors.discount_percentage ? 'border-destructive' : ''}
                                    />
                                    {errors.discount_percentage && (
                                        <p className="text-sm text-destructive">{errors.discount_percentage}</p>
                                    )}
                                </div>

                                {/* Minimum Purchase */}
                                <div className="space-y-2">
                                    <Label htmlFor="minimum_purchase">
                                        Minimum Pembelian (Rp)
                                    </Label>
                                    <Input
                                        id="minimum_purchase"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.minimum_purchase}
                                        onChange={(e) => setData('minimum_purchase', e.target.value)}
                                        placeholder="0"
                                        className={errors.minimum_purchase ? 'border-destructive' : ''}
                                    />
                                    {errors.minimum_purchase && (
                                        <p className="text-sm text-destructive">{errors.minimum_purchase}</p>
                                    )}
                                </div>

                                {/* Maximum Discount */}
                                <div className="space-y-2">
                                    <Label htmlFor="maximum_discount">
                                        Maksimum Diskon (Rp)
                                    </Label>
                                    <Input
                                        id="maximum_discount"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.maximum_discount}
                                        onChange={(e) => setData('maximum_discount', e.target.value)}
                                        placeholder="Kosongkan untuk tanpa batas"
                                        className={errors.maximum_discount ? 'border-destructive' : ''}
                                    />
                                    {errors.maximum_discount && (
                                        <p className="text-sm text-destructive">{errors.maximum_discount}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Kosongkan jika tidak ada batas maksimum diskon
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="is_active">Status</Label>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <Label htmlFor="is_active" className="font-normal">
                                            {data.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 mt-6">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Masukkan deskripsi jenis member (opsional)"
                                    rows={3}
                                    className={errors.description ? 'border-destructive' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => router.visit('/master-data/customer-discounts')}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                                        Memperbarui...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Perbarui
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
