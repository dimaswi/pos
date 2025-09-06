import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit3, Phone, Mail, MapPin, Building, CreditCard } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';

interface SupplierData {
    id: number;
    name: string;
    code: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    tax_number?: string;
    bank_name?: string;
    bank_account?: string;
    notes?: string;
    is_active: boolean;
    products_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    supplier: SupplierData;
    [key: string]: any;
}

export default function SupplierShow({ supplier }: Props) {
    const { hasPermission } = usePermission();

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
            title: supplier.name,
            href: `/master-data/suppliers/${supplier.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Supplier - ${supplier.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.visit('/master-data/suppliers')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Detail Supplier</CardTitle>
                                <CardDescription>
                                    Informasi lengkap supplier {supplier.name}
                                </CardDescription>
                            </div>
                        </div>
                        
                        {hasPermission('supplier.edit') && (
                            <Button 
                                variant="outline"
                                onClick={() => router.visit(`/master-data/suppliers/${supplier.id}/edit`)}
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Supplier
                            </Button>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Dasar</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nama Supplier</label>
                                <p className="text-lg font-medium">{supplier.name}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Kode Supplier</label>
                                <p className="text-lg font-mono">{supplier.code}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                                        {supplier.is_active ? 'Aktif' : 'Tidak Aktif'}
                                    </Badge>
                                </div>
                            </div>

                            {supplier.contact_person && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kontak Person</label>
                                    <p className="text-lg">{supplier.contact_person}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Kontak</h3>
                        <div className="space-y-4">
                            {supplier.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                                        <p className="text-base">{supplier.phone}</p>
                                    </div>
                                </div>
                            )}
                            
                            {supplier.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                                        <p className="text-base">{supplier.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Information */}
                    {(supplier.address || supplier.city || supplier.postal_code) && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Alamat</h3>
                            <div className="space-y-4">
                                {supplier.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                                            <p className="text-base">{supplier.address}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid gap-4 md:grid-cols-2 ml-8">
                                    {supplier.city && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Kota</label>
                                            <p className="text-base">{supplier.city}</p>
                                        </div>
                                    )}
                                    
                                    {supplier.postal_code && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Kode Pos</label>
                                            <p className="text-base">{supplier.postal_code}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Information */}
                    {supplier.tax_number && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Pajak</h3>
                            <div className="flex items-center gap-3">
                                <Building className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">NPWP</label>
                                    <p className="text-base font-mono">{supplier.tax_number}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Banking Information */}
                    {(supplier.bank_name || supplier.bank_account) && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Informasi Bank</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {supplier.bank_name && (
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Nama Bank</label>
                                            <p className="text-base">{supplier.bank_name}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {supplier.bank_account && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
                                        <p className="text-base font-mono">{supplier.bank_account}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    {supplier.products_count !== undefined && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Statistik</h3>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Jumlah Produk</label>
                                <p className="text-2xl font-bold">{supplier.products_count}</p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {supplier.notes && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Catatan</h3>
                            <p className="text-base">{supplier.notes}</p>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Sistem</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Dibuat Pada</label>
                                <p className="text-base">{new Date(supplier.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</label>
                                <p className="text-base">{new Date(supplier.updated_at).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
