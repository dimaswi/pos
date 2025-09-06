import React from 'react';
import { Head, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit3, Percent } from 'lucide-react';

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

interface Props {
    customerDiscount: CustomerDiscount;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function Show({ customerDiscount }: Props) {
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
            title: customerDiscount.name,
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${customerDiscount.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center justify-between">
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
                                    Detail Jenis Member
                                </CardTitle>
                                <CardDescription>
                                    Informasi lengkap jenis member: {customerDiscount.name}
                                </CardDescription>
                            </div>
                        </div>
                        <Button onClick={() => router.visit(`/master-data/customer-discounts/${customerDiscount.id}/edit`)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Jenis Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Informasi Umum</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Nama Jenis Member
                                        </label>
                                        <p className="text-sm font-medium">{customerDiscount.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Status
                                        </label>
                                        <div className="mt-1">
                                            <Badge variant={customerDiscount.is_active ? 'default' : 'secondary'}>
                                                {customerDiscount.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Persentase Diskon
                                        </label>
                                        <p className="text-sm font-medium text-green-600">
                                            {customerDiscount.discount_percentage}%
                                        </p>
                                    </div>
                                </div>

                                {customerDiscount.description && (
                                    <div className="mt-6">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Deskripsi
                                        </label>
                                        <p className="text-sm mt-1">{customerDiscount.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Discount Configuration */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Konfigurasi Diskon</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Minimum Pembelian
                                        </label>
                                        <p className="text-sm font-medium">
                                            {formatCurrency(customerDiscount.minimum_purchase)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Maksimum Diskon
                                        </label>
                                        <p className="text-sm font-medium">
                                            {customerDiscount.maximum_discount 
                                                ? formatCurrency(customerDiscount.maximum_discount)
                                                : 'Tidak ada batas'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Discount Calculation Example */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                                        Contoh Perhitungan Diskon
                                    </h4>
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <p>• Pembelian Rp 100.000 → Diskon: {formatCurrency(100000 * customerDiscount.discount_percentage / 100)}</p>
                                        <p>• Pembelian Rp 500.000 → Diskon: {formatCurrency(500000 * customerDiscount.discount_percentage / 100)}</p>
                                        {customerDiscount.maximum_discount && (
                                            <p>• Diskon maksimum: {formatCurrency(customerDiscount.maximum_discount)}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Information */}
                        <div className="space-y-6">
                            {/* System Information */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Informasi Sistem</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            ID Jenis Member
                                        </label>
                                        <p className="text-sm font-mono">{customerDiscount.id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Dibuat Pada
                                        </label>
                                        <p className="text-sm">{formatDate(customerDiscount.created_at)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Terakhir Diperbarui
                                        </label>
                                        <p className="text-sm">{formatDate(customerDiscount.updated_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Aksi Cepat</h3>
                                <div className="space-y-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => router.visit(`/master-data/customer-discounts/${customerDiscount.id}/edit`)}
                                    >
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edit Jenis Member
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => router.visit('/master-data/customer-discounts')}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali ke Daftar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
