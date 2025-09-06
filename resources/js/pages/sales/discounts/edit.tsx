import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Percent, DollarSign, Gift, Tag, Save, Calendar, Users } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/app-layout';
import { toast } from 'sonner';

interface Store {
    id: number;
    name: string;
}

interface Discount {
    id: number;
    name: string;
    code: string;
    type: 'percentage' | 'fixed' | 'buy_x_get_y';
    value: number;
    store_id?: number;
    description?: string;
    minimum_amount?: number;
    maximum_discount?: number;
    usage_limit?: number;
    usage_limit_per_customer?: number;
    minimum_quantity?: number;
    get_quantity?: number;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    apply_to_sale_items: boolean;
}

interface Props {
    discount: Discount;
    stores: Store[];
}

export default function Edit({ discount, stores }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: discount.name,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        store_id: discount.store_id || null,
        description: discount.description || '',
        minimum_amount: discount.minimum_amount || '',
        maximum_discount: discount.maximum_discount || '',
        usage_limit: discount.usage_limit || '',
        usage_limit_per_customer: discount.usage_limit_per_customer || '',
        minimum_quantity: discount.minimum_quantity || '',
        get_quantity: discount.get_quantity || '',
        start_date: discount.start_date ? discount.start_date.split('T')[0] : '',
        end_date: discount.end_date ? discount.end_date.split('T')[0] : '',
        is_active: discount.is_active,
        apply_to_sale_items: discount.apply_to_sale_items,
    });

    const handleStoreChange = (storeId: number) => {
        setData('store_id', storeId);
    };

    const calculateDiscountAmount = () => {
        const amount = 100; // Example amount for calculation
        switch (data.type) {
            case 'percentage':
                return (amount * (data.value / 100)).toFixed(2);
            case 'fixed':
                return Math.min(data.value, amount).toFixed(2);
            case 'buy_x_get_y':
                return 'Tergantung item';
            default:
                return '0.00';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(route('sales.discounts.update', discount.id), {
            onSuccess: () => {
                toast.success('Diskon berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui diskon');
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Penjualan', href: '#' },
                { title: 'Diskon', href: route('sales.discounts.index') },
                { title: discount.name, href: route('sales.discounts.show', discount.id) },
                { title: 'Edit', href: route('sales.discounts.edit', discount.id) }
            ]}
        >
            <Head title={`Edit Diskon: ${discount.name}`} />

            <div className="py-6">
                <div className="mt-6 max-w-7xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Main Information */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <Button
                                                    variant="outline"
                                                    type='button'
                                                    onClick={() => router.visit('/sales/discounts')}
                                                    className="flex items-center gap-2"
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Tag className="h-5 w-5" />
                                                    Informasi Diskon
                                                </CardTitle>
                                                <CardDescription>Informasi dasar tentang diskon</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="name">Nama Diskon *</Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="contoh: Sale Musim Panas 2024"
                                                    required
                                                />
                                                {errors.name && (
                                                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="code">Kode Diskon *</Label>
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                    placeholder="contoh: SUMMER2024"
                                                    required
                                                />
                                                {errors.code && (
                                                    <p className="text-sm text-red-600 mt-1">{errors.code}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="type">Tipe Diskon *</Label>
                                                <Select 
                                                    value={data.type} 
                                                    onValueChange={(value) => setData('type', value as any)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percentage">
                                                            <div className="flex items-center">
                                                                <Percent className="w-4 h-4 mr-2" />
                                                                Diskon Persentase
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="fixed">
                                                            <div className="flex items-center">
                                                                <DollarSign className="w-4 h-4 mr-2" />
                                                                Diskon Nominal Tetap
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="buy_x_get_y">
                                                            <div className="flex items-center">
                                                                <Gift className="w-4 h-4 mr-2" />
                                                                Beli X Gratis Y
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.type && (
                                                    <p className="text-sm text-red-600 mt-1">{errors.type}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="value">
                                                    Nilai Diskon *{data.type === 'percentage' && ' (%)'}
                                                    {data.type === 'fixed' && ' (IDR)'}
                                                </Label>
                                                <Input
                                                    id="value"
                                                    type="number"
                                                    value={data.value}
                                                    onChange={(e) => setData('value', parseFloat(e.target.value) || 0)}
                                                    placeholder={data.type === 'percentage' ? '10' : '50000'}
                                                    min="0"
                                                    step={data.type === 'percentage' ? '0.01' : '1000'}
                                                    required
                                                />
                                                {errors.value && (
                                                    <p className="text-sm text-red-600 mt-1">{errors.value}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Buy X Get Y specific fields */}
                                        {data.type === 'buy_x_get_y' && (
                                            <div className="grid grid-cols-1 gap-4 rounded border bg-purple-50 p-4 md:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="minimum_quantity">Jumlah Beli *</Label>
                                                    <Input
                                                        id="minimum_quantity"
                                                        type="number"
                                                        value={data.minimum_quantity}
                                                        onChange={(e) => setData('minimum_quantity', parseInt(e.target.value) || 1)}
                                                        placeholder="contoh: 2"
                                                        min="1"
                                                        required
                                                    />
                                                    {errors.minimum_quantity && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.minimum_quantity}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="get_quantity">Jumlah Gratis *</Label>
                                                    <Input
                                                        id="get_quantity"
                                                        type="number"
                                                        value={data.get_quantity}
                                                        onChange={(e) => setData('get_quantity', parseInt(e.target.value) || 1)}
                                                        placeholder="contoh: 1"
                                                        min="1"
                                                        required
                                                    />
                                                    {errors.get_quantity && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.get_quantity}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="store_id">Toko</Label>
                                            <Select 
                                                value={String(data.store_id || 'all')} 
                                                onValueChange={(value) => setData('store_id', value === 'all' ? null : parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih toko (opsional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Toko</SelectItem>
                                                    {stores.map((store) => (
                                                        <SelectItem key={store.id} value={String(store.id)}>
                                                            {store.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="mt-1 text-sm text-muted-foreground">Kosongkan untuk berlaku di semua toko</p>
                                        </div>

                                        <div>
                                            <Label htmlFor="description">Deskripsi</Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Deskripsi opsional tentang diskon ini"
                                                rows={3}
                                            />
                                            {errors.description && (
                                                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Settings & Conditions */}
                            <div className="space-y-6">
                                {/* Validity Period */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Calendar className="h-4 w-4" />
                                            Periode Berlaku
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="start_date">Berlaku Dari *</Label>
                                            <Input
                                                id="start_date"
                                                type="date"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                required
                                            />
                                            {errors.start_date && (
                                                <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="end_date">Berlaku Sampai</Label>
                                            <Input
                                                id="end_date"
                                                type="date"
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                            />
                                            <p className="mt-1 text-sm text-muted-foreground">Kosongkan jika tidak ada batas waktu</p>
                                            {errors.end_date && (
                                                <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Conditions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <DollarSign className="h-4 w-4" />
                                            Syarat & Ketentuan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="minimum_amount">Pembelian Minimum (IDR)</Label>
                                            <Input
                                                id="minimum_amount"
                                                type="number"
                                                value={data.minimum_amount || ''}
                                                onChange={(e) => setData('minimum_amount', e.target.value ? parseFloat(e.target.value) : '')}
                                                placeholder="contoh: 100000"
                                                min="0"
                                                step="1000"
                                            />
                                            {errors.minimum_amount && (
                                                <p className="text-sm text-red-600 mt-1">{errors.minimum_amount}</p>
                                            )}
                                        </div>

                                        {data.type === 'percentage' && (
                                            <div>
                                                <Label htmlFor="maximum_discount">Maksimal Diskon (IDR)</Label>
                                                <Input
                                                    id="maximum_discount"
                                                    type="number"
                                                    value={data.maximum_discount || ''}
                                                    onChange={(e) => setData('maximum_discount', e.target.value ? parseFloat(e.target.value) : '')}
                                                    placeholder="contoh: 50000"
                                                    min="0"
                                                    step="1000"
                                                />
                                                {errors.maximum_discount && (
                                                    <p className="text-sm text-red-600 mt-1">{errors.maximum_discount}</p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Usage Limits */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Users className="h-4 w-4" />
                                            Batas Penggunaan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="usage_limit">Total Batas Penggunaan</Label>
                                            <Input
                                                id="usage_limit"
                                                type="number"
                                                value={data.usage_limit || ''}
                                                onChange={(e) => setData('usage_limit', e.target.value ? parseInt(e.target.value) : '')}
                                                placeholder="contoh: 100"
                                                min="1"
                                            />
                                            <p className="mt-1 text-sm text-muted-foreground">Kosongkan untuk penggunaan tak terbatas</p>
                                            {errors.usage_limit && (
                                                <p className="text-sm text-red-600 mt-1">{errors.usage_limit}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="usage_limit_per_customer">Batas Penggunaan per Pelanggan</Label>
                                            <Input
                                                id="usage_limit_per_customer"
                                                type="number"
                                                value={data.usage_limit_per_customer || ''}
                                                onChange={(e) => setData('usage_limit_per_customer', e.target.value ? parseInt(e.target.value) : '')}
                                                placeholder="contoh: 1"
                                                min="1"
                                            />
                                            {errors.usage_limit_per_customer && (
                                                <p className="text-sm text-red-600 mt-1">{errors.usage_limit_per_customer}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Settings */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Percent className="h-4 w-4" />
                                            Pengaturan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Status Aktif</Label>
                                                <p className="text-sm text-muted-foreground">Aktifkan diskon ini untuk digunakan</p>
                                            </div>
                                            <Switch 
                                                checked={data.is_active} 
                                                onCheckedChange={(checked) => setData('is_active', checked)} 
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Berlaku untuk Item Penjualan</Label>
                                                <p className="text-sm text-muted-foreground">Terapkan diskon ke item individual vs total</p>
                                            </div>
                                            <Switch
                                                checked={data.apply_to_sale_items}
                                                onCheckedChange={(checked) => setData('apply_to_sale_items', checked)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Actions */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-2">
                                            <Button type="submit" disabled={processing} className="flex w-full items-center gap-2">
                                                <Save className="h-4 w-4" />
                                                {processing ? 'Memperbarui...' : 'Perbarui Diskon'}
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={() => router.visit(route('sales.discounts.show', discount.id))} 
                                                className="w-full"
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
