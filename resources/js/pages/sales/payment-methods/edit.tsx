import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { toast } from 'sonner';
import { useState } from 'react';

interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    type: string;
    description?: string;
    fee_percentage: number;
    fee_fixed: number;
    requires_reference: boolean;
    is_active: boolean;
    sort_order: number;
}

interface FormData {
    name: string;
    code: string;
    type: string;
    description: string;
    fee_type: string;
    fee_value: number;
    is_active: boolean;
}

interface Props {
    paymentMethod: PaymentMethod;
    errors?: Record<string, string>;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/sales' },
    { title: 'Payment Methods', href: '/sales/payment-methods' },
    { title: 'Edit', href: '#' },
];

export default function PaymentMethodEdit({ paymentMethod }: Props) {
    const { errors } = usePage<Props>().props;

    // Convert payment method data to form format
    const getInitialFeeType = () => {
        if (paymentMethod.fee_percentage > 0) return 'percentage';
        if (paymentMethod.fee_fixed > 0) return 'fixed';
        return 'none';
    };

    const getInitialFeeValue = () => {
        if (paymentMethod.fee_percentage > 0) return paymentMethod.fee_percentage;
        if (paymentMethod.fee_fixed > 0) return paymentMethod.fee_fixed;
        return 0;
    };

    const [formData, setFormData] = useState<FormData>({
        name: paymentMethod.name,
        code: paymentMethod.code,
        type: paymentMethod.type,
        description: paymentMethod.description || '',
        fee_type: getInitialFeeType(),
        fee_value: getInitialFeeValue(),
        is_active: paymentMethod.is_active,
    });

    const typeOptions = [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card (Debit/Credit)' },
        { value: 'digital', label: 'Digital Wallet' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'credit', label: 'Credit/Installment' },
        { value: 'other', label: 'Other' },
    ];

    const feeTypeOptions = [
        { value: 'none', label: 'No Fee' },
        { value: 'percentage', label: 'Percentage (%)' },
        { value: 'fixed', label: 'Fixed Amount' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) {
            toast.error('Nama metode pembayaran diperlukan');
            return;
        }

        if (!formData.code.trim()) {
            toast.error('Kode metode pembayaran diperlukan');
            return;
        }

        if (!formData.type) {
            toast.error('Tipe metode pembayaran diperlukan');
            return;
        }

        if (formData.fee_type !== 'none' && formData.fee_value <= 0) {
            toast.error('Nilai biaya harus lebih besar dari 0');
            return;
        }

        // Prepare data for submission
        const submitData = {
            ...formData,
            fee_value: formData.fee_type === 'none' ? 0 : formData.fee_value,
        };

        router.put(`/sales/payment-methods/${paymentMethod.id}`, submitData, {
            onSuccess: () => {
                toast.success('Metode pembayaran berhasil diperbarui');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error('Silakan periksa form untuk kesalahan');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Payment Method: ${paymentMethod.name}`} />

            <div className="mt-6 max-w-7xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div>
                                <Button variant="outline" onClick={() => router.visit('/sales/payment-methods')} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Edit Payment Method: {paymentMethod.name}
                                </CardTitle>
                                <CardDescription>Update payment method with fee configuration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Informasi Dasar</h3>

                                <div>
                                    <Label htmlFor="name">Nama Metode Pembayaran *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="contoh: Tunai, Kartu Kredit, QRIS"
                                        className={errors?.name ? 'border-red-500' : ''}
                                    />
                                    {errors?.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="code">Kode Metode Pembayaran *</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                                        placeholder="contoh: CASH, CARD, QRIS"
                                        className={errors?.code ? 'border-red-500' : ''}
                                    />
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Kode unik untuk identifikasi internal (akan otomatis diubah ke huruf besar)
                                    </p>
                                    {errors?.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="type">Tipe Pembayaran *</Label>
                                    <SearchableSelect
                                        value={formData.type}
                                        onValueChange={(value) => handleInputChange('type', value)}
                                        options={typeOptions}
                                        placeholder="Pilih tipe pembayaran"
                                        emptyText="Tipe pembayaran tidak ditemukan"
                                    />
                                    {errors?.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Deskripsi atau catatan opsional tentang metode pembayaran ini"
                                        rows={3}
                                    />
                                    {errors?.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="is_active">Status Aktif</Label>
                                        <p className="text-sm text-muted-foreground">Aktifkan metode pembayaran ini untuk digunakan</p>
                                    </div>
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                    />
                                </div>
                            </div>

                            {/* Fee Configuration */}
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-lg font-medium">Konfigurasi Biaya</h3>

                                <div>
                                    <Label htmlFor="fee_type">Tipe Biaya</Label>
                                    <SearchableSelect
                                        value={formData.fee_type}
                                        onValueChange={(value) => handleInputChange('fee_type', value)}
                                        options={feeTypeOptions}
                                        placeholder="Pilih tipe biaya"
                                        emptyText="Tipe biaya tidak ditemukan"
                                    />
                                    {errors?.fee_type && <p className="mt-1 text-sm text-red-600">{errors.fee_type}</p>}
                                </div>

                                {formData.fee_type !== 'none' && (
                                    <div>
                                        <Label htmlFor="fee_value">Nilai Biaya {formData.fee_type === 'percentage' ? '(%)' : '(IDR)'}</Label>
                                        <Input
                                            id="fee_value"
                                            type="number"
                                            value={formData.fee_value}
                                            onChange={(e) => handleInputChange('fee_value', parseFloat(e.target.value) || 0)}
                                            placeholder={formData.fee_type === 'percentage' ? '2.5' : '5000'}
                                            min="0"
                                            step={formData.fee_type === 'percentage' ? '0.01' : '100'}
                                            className={errors?.fee_value ? 'border-red-500' : ''}
                                        />
                                        {formData.fee_type === 'percentage' && formData.fee_value > 0 && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Contoh biaya untuk {formatCurrency(100000)}: {formatCurrency(100000 * (formData.fee_value / 100))}
                                            </p>
                                        )}
                                        {formData.fee_type === 'fixed' && formData.fee_value > 0 && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Biaya tetap: {formatCurrency(formData.fee_value)} per transaksi
                                            </p>
                                        )}
                                        {errors?.fee_value && <p className="mt-1 text-sm text-red-600">{errors.fee_value}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center gap-2 border-t pt-4">
                                <Button type="submit" className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Update Metode Pembayaran
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.visit('/sales/payment-methods')}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
