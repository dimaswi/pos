import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign, Percent, Save, Tag, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoreData {
    id: number;
    name: string;
}

interface FormData {
    name: string;
    code: string;
    type: string;
    value: number;
    store_id: string;
    description: string;
    minimum_amount: number | null;
    maximum_discount: number | null;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
    apply_to_sale_items: boolean;
    minimum_quantity: number | null;
    get_quantity: number | null;
}

interface Props {
    stores: StoreData[];
    errors?: Record<string, string>;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/sales' },
    { title: 'Discounts', href: '/sales/discounts' },
    { title: 'Create', href: '/sales/discounts/create' },
];

export default function DiscountCreate() {
    const { stores, errors } = usePage<Props>().props;

    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
        type: '',
        value: 0,
        store_id: '',
        description: '',
        minimum_amount: null,
        maximum_discount: null,
        usage_limit: null,
        usage_limit_per_customer: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true,
        apply_to_sale_items: false,
        minimum_quantity: null,
        get_quantity: null,
    });

    const storeOptions = [
        { value: '', label: 'All Stores' },
        ...stores.map((store) => ({
            value: store.id.toString(),
            label: store.name,
        })),
    ];

    const typeOptions = [
        { value: 'percentage', label: 'Percentage Discount' },
        { value: 'fixed', label: 'Fixed Amount Discount' },
        { value: 'buy_x_get_y', label: 'Buy X Get Y' },
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
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            // Auto-generate code from name if code is empty
            if (field === 'name' && !prev.code) {
                newData.code = value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .substring(0, 10);
            }

            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) {
            toast.error('Discount name is required');
            return;
        }

        if (!formData.code.trim()) {
            toast.error('Discount code is required');
            return;
        }

        if (!formData.type) {
            toast.error('Discount type is required');
            return;
        }

        if (formData.value <= 0) {
            toast.error('Discount value must be greater than 0');
            return;
        }

        if (formData.type === 'percentage' && formData.value > 100) {
            toast.error('Percentage discount cannot exceed 100%');
            return;
        }

        if (formData.end_date && formData.end_date <= formData.start_date) {
            toast.error('End date must be after start date');
            return;
        }

        if (formData.type === 'buy_x_get_y') {
            if (!formData.minimum_quantity || formData.minimum_quantity <= 0) {
                toast.error('Minimum quantity is required for Buy X Get Y discount');
                return;
            }
            if (!formData.get_quantity || formData.get_quantity <= 0) {
                toast.error('Get quantity is required for Buy X Get Y discount');
                return;
            }
        }

        // Prepare data for submission
        const submitData = {
            ...formData,
            store_id: formData.store_id || null,
            minimum_amount: formData.minimum_amount || null,
            maximum_discount: formData.maximum_discount || null,
            usage_limit: formData.usage_limit || null,
            usage_limit_per_customer: formData.usage_limit_per_customer || null,
            end_date: formData.end_date || null,
            minimum_quantity: formData.minimum_quantity || null,
            get_quantity: formData.get_quantity || null,
        };

        router.post('/sales/discounts', submitData, {
            onSuccess: () => {
                toast.success('Discount created successfully');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error('Please check the form for errors');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Discount" />

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
                                                Discount Information
                                            </CardTitle>
                                            <CardDescription>Basic information about the discount</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="name">Discount Name *</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="e.g., Summer Sale 2024"
                                                className={errors?.name ? 'border-red-500' : ''}
                                            />
                                            {errors?.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="code">Discount Code *</Label>
                                            <Input
                                                id="code"
                                                type="text"
                                                value={formData.code}
                                                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                                                placeholder="e.g., SUMMER2024"
                                                className={errors?.code ? 'border-red-500' : ''}
                                            />
                                            {errors?.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="type">Discount Type *</Label>
                                            <SearchableSelect
                                                value={formData.type}
                                                onValueChange={(value) => handleInputChange('type', value)}
                                                options={typeOptions}
                                                placeholder="Select discount type"
                                                emptyText="No discount type found"
                                            />
                                            {errors?.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="value">
                                                Discount Value *{formData.type === 'percentage' && ' (%)'}
                                                {formData.type === 'fixed' && ' (IDR)'}
                                            </Label>
                                            <Input
                                                id="value"
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                                                placeholder={formData.type === 'percentage' ? '10' : '50000'}
                                                min="0"
                                                step={formData.type === 'percentage' ? '0.01' : '1000'}
                                                className={errors?.value ? 'border-red-500' : ''}
                                            />
                                            {formData.type === 'percentage' && formData.value > 0 && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Example: {formData.value}% off {formatCurrency(100000)} ={' '}
                                                    {formatCurrency(100000 * (formData.value / 100))} discount
                                                </p>
                                            )}
                                            {formData.type === 'fixed' && formData.value > 0 && (
                                                <p className="mt-1 text-sm text-muted-foreground">Fixed discount: {formatCurrency(formData.value)}</p>
                                            )}
                                            {errors?.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
                                        </div>
                                    </div>

                                    {/* Buy X Get Y specific fields */}
                                    {formData.type === 'buy_x_get_y' && (
                                        <div className="grid grid-cols-1 gap-4 rounded border bg-purple-50 p-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="minimum_quantity">Buy Quantity *</Label>
                                                <Input
                                                    id="minimum_quantity"
                                                    type="number"
                                                    value={formData.minimum_quantity || ''}
                                                    onChange={(e) => handleInputChange('minimum_quantity', parseInt(e.target.value) || null)}
                                                    placeholder="e.g., 2"
                                                    min="1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="get_quantity">Get Quantity *</Label>
                                                <Input
                                                    id="get_quantity"
                                                    type="number"
                                                    value={formData.get_quantity || ''}
                                                    onChange={(e) => handleInputChange('get_quantity', parseInt(e.target.value) || null)}
                                                    placeholder="e.g., 1"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="store_id">Store</Label>
                                        <SearchableSelect
                                            value={formData.store_id}
                                            onValueChange={(value) => handleInputChange('store_id', value)}
                                            options={storeOptions}
                                            placeholder="Select store (optional)"
                                            emptyText="No store found"
                                        />
                                        <p className="mt-1 text-sm text-muted-foreground">Leave empty to apply to all stores</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Optional description about this discount"
                                            rows={3}
                                        />
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
                                        Validity Period
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="start_date">Start Date *</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="end_date">End Date</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                                        />
                                        <p className="mt-1 text-sm text-muted-foreground">Leave empty for no expiry</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Conditions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <DollarSign className="h-4 w-4" />
                                        Conditions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="minimum_amount">Minimum Purchase (IDR)</Label>
                                        <Input
                                            id="minimum_amount"
                                            type="number"
                                            value={formData.minimum_amount || ''}
                                            onChange={(e) => handleInputChange('minimum_amount', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder="e.g., 100000"
                                            min="0"
                                            step="1000"
                                        />
                                    </div>

                                    {formData.type === 'percentage' && (
                                        <div>
                                            <Label htmlFor="maximum_discount">Maximum Discount (IDR)</Label>
                                            <Input
                                                id="maximum_discount"
                                                type="number"
                                                value={formData.maximum_discount || ''}
                                                onChange={(e) =>
                                                    handleInputChange('maximum_discount', e.target.value ? parseInt(e.target.value) : null)
                                                }
                                                placeholder="e.g., 50000"
                                                min="0"
                                                step="1000"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Usage Limits */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Users className="h-4 w-4" />
                                        Usage Limits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="usage_limit">Total Usage Limit</Label>
                                        <Input
                                            id="usage_limit"
                                            type="number"
                                            value={formData.usage_limit || ''}
                                            onChange={(e) => handleInputChange('usage_limit', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder="e.g., 100"
                                            min="1"
                                        />
                                        <p className="mt-1 text-sm text-muted-foreground">Leave empty for unlimited usage</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="usage_limit_per_customer">Usage Limit per Customer</Label>
                                        <Input
                                            id="usage_limit_per_customer"
                                            type="number"
                                            value={formData.usage_limit_per_customer || ''}
                                            onChange={(e) =>
                                                handleInputChange('usage_limit_per_customer', e.target.value ? parseInt(e.target.value) : null)
                                            }
                                            placeholder="e.g., 1"
                                            min="1"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Percent className="h-4 w-4" />
                                        Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Active Status</Label>
                                            <p className="text-sm text-muted-foreground">Enable this discount for use</p>
                                        </div>
                                        <Switch checked={formData.is_active} onCheckedChange={(checked) => handleInputChange('is_active', checked)} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Apply to Sale Items</Label>
                                            <p className="text-sm text-muted-foreground">Apply discount to individual items vs total</p>
                                        </div>
                                        <Switch
                                            checked={formData.apply_to_sale_items}
                                            onCheckedChange={(checked) => handleInputChange('apply_to_sale_items', checked)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-2">
                                        <Button type="submit" className="flex w-full items-center gap-2">
                                            <Save className="h-4 w-4" />
                                            Create Discount
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => router.visit('/sales/discounts')} className="w-full">
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
