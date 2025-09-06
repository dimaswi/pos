import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface Props {
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Data',
        href: '/master-data',
    },
    {
        title: 'Supplier',
        href: '/master-data/suppliers',
    },
    {
        title: 'Tambah',
        href: '/master-data/suppliers/create',
    },
];

export default function SupplierCreate(props: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        tax_number: '',
        payment_term: 'cash',
        credit_limit: '',
        notes: '',
        is_active: true as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/master-data/suppliers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Supplier" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/master-data/suppliers')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Tambah Supplier</CardTitle>
                            <CardDescription>
                                Tambahkan supplier baru ke sistem
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Dasar</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Supplier Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Supplier *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama supplier"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Supplier Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Supplier *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode supplier"
                                        className={errors.code ? 'border-destructive' : ''}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-destructive">{errors.code}</p>
                                    )}
                                </div>

                                {/* Contact Person */}
                                <div className="space-y-2">
                                    <Label htmlFor="contact_person">Kontak Person</Label>
                                    <Input
                                        id="contact_person"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        placeholder="Masukkan nama kontak person"
                                        className={errors.contact_person ? 'border-destructive' : ''}
                                    />
                                    {errors.contact_person && (
                                        <p className="text-sm text-destructive">{errors.contact_person}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telepon</Label>
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

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Masukkan alamat email"
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>

                                {/* Tax Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="tax_number">NPWP</Label>
                                    <Input
                                        id="tax_number"
                                        value={data.tax_number}
                                        onChange={(e) => setData('tax_number', e.target.value)}
                                        placeholder="Masukkan nomor NPWP"
                                        className={errors.tax_number ? 'border-destructive' : ''}
                                    />
                                    {errors.tax_number && (
                                        <p className="text-sm text-destructive">{errors.tax_number}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Alamat</h3>
                            <div className="space-y-4">
                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat</Label>
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('address', e.target.value)}
                                        placeholder="Masukkan alamat lengkap"
                                        className={errors.address ? 'border-destructive' : ''}
                                        rows={3}
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-destructive">{errors.address}</p>
                                    )}
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* City */}
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Kota</Label>
                                        <Input
                                            id="city"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="Masukkan nama kota"
                                            className={errors.city ? 'border-destructive' : ''}
                                        />
                                        {errors.city && (
                                            <p className="text-sm text-destructive">{errors.city}</p>
                                        )}
                                    </div>

                                    {/* Postal Code */}
                                    <div className="space-y-2">
                                        <Label htmlFor="postal_code">Kode Pos</Label>
                                        <Input
                                            id="postal_code"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder="Masukkan kode pos"
                                            className={errors.postal_code ? 'border-destructive' : ''}
                                        />
                                        {errors.postal_code && (
                                            <p className="text-sm text-destructive">{errors.postal_code}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Company Information */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Perusahaan</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Company Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Nama Perusahaan</Label>
                                    <Input
                                        id="company_name"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        placeholder="Masukkan nama perusahaan"
                                        className={errors.company_name ? 'border-destructive' : ''}
                                    />
                                    {errors.company_name && (
                                        <p className="text-sm text-destructive">{errors.company_name}</p>
                                    )}
                                </div>

                                {/* Province */}
                                <div className="space-y-2">
                                    <Label htmlFor="province">Provinsi</Label>
                                    <Input
                                        id="province"
                                        value={data.province}
                                        onChange={(e) => setData('province', e.target.value)}
                                        placeholder="Masukkan provinsi"
                                        className={errors.province ? 'border-destructive' : ''}
                                    />
                                    {errors.province && (
                                        <p className="text-sm text-destructive">{errors.province}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Syarat Pembayaran</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Payment Term */}
                                <div className="space-y-2">
                                    <Label htmlFor="payment_term">Termin Pembayaran</Label>
                                    <Select value={data.payment_term} onValueChange={(value) => setData('payment_term', value)}>
                                        <SelectTrigger className={errors.payment_term ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Pilih termin pembayaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="credit_7">Kredit 7 Hari</SelectItem>
                                            <SelectItem value="credit_14">Kredit 14 Hari</SelectItem>
                                            <SelectItem value="credit_30">Kredit 30 Hari</SelectItem>
                                            <SelectItem value="credit_60">Kredit 60 Hari</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.payment_term && (
                                        <p className="text-sm text-destructive">{errors.payment_term}</p>
                                    )}
                                </div>

                                {/* Credit Limit */}
                                <div className="space-y-2">
                                    <Label htmlFor="credit_limit">Limit Kredit</Label>
                                    <Input
                                        id="credit_limit"
                                        type="number"
                                        value={data.credit_limit}
                                        onChange={(e) => setData('credit_limit', e.target.value)}
                                        placeholder="0"
                                        className={errors.credit_limit ? 'border-destructive' : ''}
                                    />
                                    {errors.credit_limit && (
                                        <p className="text-sm text-destructive">{errors.credit_limit}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Tambahan</h3>
                            <div className="space-y-4">
                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                        placeholder="Masukkan catatan tambahan"
                                        className={errors.notes ? 'border-destructive' : ''}
                                        rows={3}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-destructive">{errors.notes}</p>
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
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                Simpan Supplier
                            </Button>
                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={() => router.visit('/master-data/suppliers')}
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
