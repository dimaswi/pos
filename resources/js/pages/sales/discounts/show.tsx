import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ToggleLeft, ToggleRight, Calendar, Store, Users, Percent, DollarSign, Gift } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/app-layout';
import PermissionGate from '@/components/permission-gate';

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
    store?: Store;
    description?: string;
    minimum_amount?: number;
    maximum_discount?: number;
    usage_limit?: number;
    usage_limit_per_customer?: number;
    usage_count: number;
    minimum_quantity?: number;
    get_quantity?: number;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    apply_to_sale_items: boolean;
    created_at: string;
    updated_at: string;
    usage_stats?: {
        total_usage: number;
        total_discount_amount: number;
        this_month_usage: number;
        this_month_discount_amount: number;
    };
}

interface Props {
    discount: Discount;
}

export default function Show({ discount }: Props) {
    const formatCurrency = (amount: number | string | null | undefined): string => {
        const numAmount = parseFloat(String(amount || 0));
        if (isNaN(numAmount)) return 'Rp 0';
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'percentage': return <Percent className="w-5 h-5" />;
            case 'fixed': return <DollarSign className="w-5 h-5" />;
            case 'buy_x_get_y': return <Gift className="w-5 h-5" />;
            default: return <Percent className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'percentage': return 'Diskon Persentase';
            case 'fixed': return 'Diskon Nominal Tetap';
            case 'buy_x_get_y': return 'Beli X Gratis Y';
            default: return type;
        }
    };

    const getDiscountValue = () => {
        switch (discount.type) {
            case 'percentage':
                return `${discount.value}%`;
            case 'fixed':
                return formatCurrency(discount.value);
            case 'buy_x_get_y':
                return `Beli ${discount.minimum_quantity || 0} Gratis ${discount.get_quantity || 0}`;
            default:
                return discount.value;
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Penjualan', href: '#' },
                { title: 'Diskon', href: route('sales.discounts.index') },
                { title: discount.name, href: route('sales.discounts.show', discount.id) }
            ]}
        >
            <Head title={`Diskon: ${discount.name}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <PermissionGate permission="discount.index">
                                <Link href={route('sales.discounts.index')}>
                                    <Button variant="outline" size="sm">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Kembali
                                    </Button>
                                </Link>
                            </PermissionGate>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Detail Diskon
                            </h2>
                        </div>
                        <div className="flex space-x-2">
                            <PermissionGate permission="discount.edit">
                                <Link href={route('sales.discounts.edit', discount.id)}>
                                    <Button>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                            </PermissionGate>
                        </div>
                    </div>

                    {/* Main Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon(discount.type)}
                                            <div>
                                                <CardTitle className="text-2xl">{discount.name}</CardTitle>
                                                <CardDescription>{getTypeLabel(discount.type)}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={discount.is_active ? 'secondary' : 'destructive'}>
                                            {discount.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Kode Diskon</h4>
                                            <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">{discount.code}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Nilai Diskon</h4>
                                            <p className="text-lg font-semibold text-green-600">{getDiscountValue()}</p>
                                        </div>
                                        {discount.minimum_amount && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Jumlah Minimum</h4>
                                                <p className="text-lg">{formatCurrency(discount.minimum_amount)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Penggunaan</h4>
                                            <p className="text-lg">
                                                {discount.usage_count} 
                                                {discount.usage_limit ? ` / ${discount.usage_limit}` : ' / Tidak Terbatas'}
                                            </p>
                                        </div>
                                    </div>

                                    {discount.description && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Deskripsi</h4>
                                            <p className="text-gray-700">{discount.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Validity Period */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Calendar className="w-5 h-5 mr-2" />
                                        Periode Berlaku
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Berlaku Dari</h4>
                                            <p className="text-lg">{new Date(discount.start_date).toLocaleDateString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Berlaku Sampai</h4>
                                            <p className="text-lg">
                                                {discount.end_date 
                                                    ? new Date(discount.end_date).toLocaleDateString('id-ID') 
                                                    : 'Tidak ada batas waktu'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Store Applicability */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Store className="w-5 h-5 mr-2" />
                                        Berlaku untuk Toko
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {discount.store_id ? (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Toko yang Berlaku</h4>
                                            <Badge variant="outline">{discount.store?.name || 'Toko Tidak Ditemukan'}</Badge>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="secondary">Semua Toko</Badge>
                                            <span className="text-gray-600">Diskon ini berlaku untuk semua toko</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Usage Statistics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        Statistik Penggunaan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Kali Digunakan</span>
                                            <span className="font-semibold">{discount.usage_count}</span>
                                        </div>
                                        {discount.usage_limit && (
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full" 
                                                    style={{ 
                                                        width: `${Math.min((discount.usage_count / discount.usage_limit) * 100, 100)}%` 
                                                    }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Sisa Penggunaan</span>
                                            <span className="font-semibold">
                                                {discount.usage_limit 
                                                    ? discount.usage_limit - discount.usage_count 
                                                    : 'Tidak Terbatas'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Status</span>
                                        <Badge variant={discount.is_active ? 'secondary' : 'destructive'}>
                                            {discount.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Dibuat</span>
                                        <span className="text-sm">{new Date(discount.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Terakhir Diperbarui</span>
                                        <span className="text-sm">{new Date(discount.updated_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
