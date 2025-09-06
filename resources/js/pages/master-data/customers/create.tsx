import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { toast } from 'sonner';

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
}

interface Props {
    customerDiscounts: CustomerDiscount[];
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Data',
        href: '/master-data',
    },
    {
        title: 'Pelanggan',
        href: '/master-data/customers',
    },
    {
        title: 'Tambah',
        href: '/master-data/customers/create',
    },
];

export default function CustomerCreate() {
    const { customerDiscounts } = usePage<Props>().props;
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        gender: '',
        customer_discount_id: '',
        notes: '',
    });

    const customerDiscountOptions = [
        { value: '', label: 'Tanpa Member (Reguler)' },
        ...(customerDiscounts || []).map(discount => ({
            value: discount.id.toString(),
            label: `${discount.name} (${discount.discount_percentage || 0}% diskon)`
        }))
    ];

    const genderOptions = [
        { value: '', label: 'Pilih Jenis Kelamin' },
        { value: 'male', label: 'Laki-laki' },
        { value: 'female', label: 'Perempuan' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('master-data.customers.store'), {
            onSuccess: () => {
                toast.success('Customer berhasil ditambahkan');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pelanggan" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Link href="/master-data/customers">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <CardTitle className="text-2xl">Tambah Pelanggan</CardTitle>
                            <CardDescription>
                                Tambahkan data pelanggan baru untuk transaksi dan program keanggotaan
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Customer Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Pelanggan *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Masukkan nama pelanggan"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Masukkan email pelanggan"
                                    className={errors.email ? 'border-destructive' : ''}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor Telepon</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="Masukkan nomor telepon"
                                    className={errors.phone ? 'border-destructive' : ''}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone}</p>
                                )}
                            </div>

                            {/* Birth Date */}
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={data.birth_date}
                                    onChange={(e) => setData('birth_date', e.target.value)}
                                    className={errors.birth_date ? 'border-destructive' : ''}
                                />
                                {errors.birth_date && (
                                    <p className="text-sm text-destructive">{errors.birth_date}</p>
                                )}
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label htmlFor="gender">Jenis Kelamin</Label>
                                <SearchableSelect
                                    options={genderOptions}
                                    value={data.gender}
                                    onValueChange={(value) => setData('gender', value)}
                                    placeholder="Pilih jenis kelamin..."
                                />
                                {errors.gender && (
                                    <p className="text-sm text-destructive">{errors.gender}</p>
                                )}
                            </div>

                            {/* Customer Discount */}
                            <div className="space-y-2">
                                <Label htmlFor="customer_discount_id">Jenis Member</Label>
                                <SearchableSelect
                                    options={customerDiscountOptions}
                                    value={data.customer_discount_id}
                                    onValueChange={(value) => setData('customer_discount_id', value)}
                                    placeholder="Pilih jenis member..."
                                />
                                {errors.customer_discount_id && (
                                    <p className="text-sm text-destructive">{errors.customer_discount_id}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Pelanggan dengan jenis member akan mendapatkan diskon sesuai ketentuan
                                </p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Masukkan alamat lengkap pelanggan"
                                className={errors.address ? 'border-destructive' : ''}
                                rows={3}
                            />
                            {errors.address && (
                                <p className="text-sm text-destructive">{errors.address}</p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Masukkan catatan tambahan (opsional)"
                                className={errors.notes ? 'border-destructive' : ''}
                                rows={3}
                            />
                            {errors.notes && (
                                <p className="text-sm text-destructive">{errors.notes}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="min-w-[120px]"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan
                                    </>
                                )}
                            </Button>
                            <Link href="/master-data/customers">
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
