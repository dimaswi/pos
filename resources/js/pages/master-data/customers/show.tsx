import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit3, Calendar, Phone, Mail, MapPin, User2, CreditCard, ShoppingCart, TrendingUp } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
}

interface Customer {
    id: number;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    birth_date: string | null;
    gender: 'male' | 'female' | null;
    customer_discount_id: number | null;
    customer_discount?: CustomerDiscount;
    membership_date: string | null;
    total_points: number;
    total_spent: number;
    total_transactions: number;
    last_transaction_date: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    created_by?: {
        name: string;
    };
    updated_by?: {
        name: string;
    };
}

interface TransactionStats {
    total_transactions: number;
    total_spent: number;
    last_transaction: string | null;
    average_transaction: number;
}

interface Transaction {
    id: number;
    transaction_number: string;
    transaction_date: string;
    total_amount: number;
    status: string;
    store: {
        name: string;
    };
    payments: Array<{
        payment_method: {
            name: string;
        };
    }>;
}

interface Props {
    customer: Customer;
    transactionStats: TransactionStats;
    recentTransactions: Transaction[];
}

export default function CustomerShow({ customer, transactionStats, recentTransactions }: Props) {
    
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
            title: customer.name,
            href: `/master-data/customers/${customer.id}`,
        },
    ];

    const getCustomerDiscountDisplay = (customerDiscount?: CustomerDiscount) => {
        return customerDiscount ? customerDiscount.name : 'Tanpa Member (Reguler)';
    };

    const getCustomerDiscountBadgeVariant = (customerDiscount?: CustomerDiscount) => {
        if (!customerDiscount) return 'secondary';
        if (customerDiscount.discount_percentage >= 10) return 'default';
        if (customerDiscount.discount_percentage >= 5) return 'outline';
        return 'secondary';
    };

    const getGenderDisplay = (gender: string | null) => {
        if (!gender) return '-';
        return gender === 'male' ? 'Laki-laki' : 'Perempuan';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(dateString));
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />

            <div className="mt-6 space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/master-data/customers">
                                    <Button variant="outline" size="sm">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-2xl">{customer.name}</CardTitle>
                                        <Badge variant={getCustomerDiscountBadgeVariant(customer.customer_discount) as any}>
                                            {getCustomerDiscountDisplay(customer.customer_discount)}
                                        </Badge>
                                        <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                                            {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Kode Pelanggan: {customer.code}
                                    </CardDescription>
                                </div>
                            </div>
                            <PermissionGate permission="customer.edit">
                                <Link href={`/master-data/customers/${customer.id}/edit`}>
                                    <Button className="flex items-center gap-2">
                                        <Edit3 className="h-4 w-4" />
                                        Edit Pelanggan
                                    </Button>
                                </Link>
                            </PermissionGate>
                        </div>
                    </CardHeader>
                </Card>

                {/* Transaction Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{transactionStats.total_transactions}</div>
                            <p className="text-xs text-muted-foreground">
                                Terakhir: {formatDate(transactionStats.last_transaction)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Belanja</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(transactionStats.total_spent)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(transactionStats.average_transaction)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
                            <div className="h-4 w-4 bg-yellow-500 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{customer.total_points.toLocaleString('id-ID')}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pelanggan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Nama:</div>
                                <div className="col-span-2">{customer.name}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Kode:</div>
                                <div className="col-span-2">{customer.code}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Email:</div>
                                <div className="col-span-2 flex items-center gap-2">
                                    {customer.email ? (
                                        <>
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            {customer.email}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Telepon:</div>
                                <div className="col-span-2 flex items-center gap-2">
                                    {customer.phone ? (
                                        <>
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {customer.phone}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Alamat:</div>
                                <div className="col-span-2 flex items-start gap-2">
                                    {customer.address ? (
                                        <>
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            {customer.address}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Tanggal Lahir:</div>
                                <div className="col-span-2 flex items-center gap-2">
                                    {customer.birth_date ? (
                                        <>
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {formatDate(customer.birth_date)}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Jenis Kelamin:</div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <User2 className="h-4 w-4 text-muted-foreground" />
                                    {getGenderDisplay(customer.gender)}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-muted-foreground">Jenis Member:</div>
                                <div className="col-span-2">
                                    <Badge variant={getCustomerDiscountBadgeVariant(customer.customer_discount) as any}>
                                        {getCustomerDiscountDisplay(customer.customer_discount)}
                                    </Badge>
                                    {customer.customer_discount && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Diskon {customer.customer_discount.discount_percentage}%
                                        </p>
                                    )}
                                </div>
                            </div>
                            {customer.membership_date && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-sm font-medium text-muted-foreground">Tanggal Bergabung:</div>
                                    <div className="col-span-2">{formatDate(customer.membership_date)}</div>
                                </div>
                            )}
                            {customer.notes && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-sm font-medium text-muted-foreground">Catatan:</div>
                                    <div className="col-span-2">{customer.notes}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaksi Terakhir</CardTitle>
                            <CardDescription>
                                {recentTransactions.length} transaksi terakhir
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-4">
                                    {recentTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <div className="font-medium">{transaction.transaction_number}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDateTime(transaction.transaction_date)} • {transaction.store.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {transaction.payments.map(p => p.payment_method.name).join(', ')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatCurrency(transaction.total_amount)}</div>
                                                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                                    {transaction.status === 'completed' ? 'Selesai' : transaction.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    Belum ada transaksi
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Sistem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-medium text-muted-foreground">Dibuat pada:</div>
                                <div>{formatDateTime(customer.created_at)}</div>
                                {customer.created_by && (
                                    <div className="text-muted-foreground">oleh {customer.created_by.name}</div>
                                )}
                            </div>
                            {customer.updated_by && (
                                <div>
                                    <div className="font-medium text-muted-foreground">Terakhir diubah:</div>
                                    <div className="text-muted-foreground">oleh {customer.updated_by.name}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
