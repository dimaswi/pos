import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, X, Eye, Edit3, Plus, Receipt, Trash2, Ban, TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import PermissionGate from '@/components/permission-gate';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoreData {
    id: number;
    name: string;
}

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
}

interface CustomerData {
    id: number;
    name: string;
    code: string;
    customer_discount_id: number | null;
    customer_discount?: CustomerDiscount;
}

interface UserData {
    id: number;
    name: string;
}

interface SalesTransactionData {
    id: number;
    transaction_number: string;
    reference_number: string | null;
    store_id: number;
    customer_id: number | null;
    user_id: number;
    transaction_date: string;
    subtotal_amount: number;
    discount_amount: number;
    customer_discount_amount: number;
    customer_discount_percentage: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    change_amount: number;
    status: string;
    payment_status: string;
    notes: string | null;
    store: StoreData;
    customer: CustomerData | null;
    user: UserData;
}

interface PaginatedTransactions {
    data: SalesTransactionData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface StatsData {
    total_transactions: number;
    total_revenue: number;
    today_transactions: number;
    today_revenue: number;
}

interface Props {
    transactions: PaginatedTransactions;
    stores: StoreData[];
    stats: StatsData;
    filters?: {
        search: string;
        store_id: string;
        status: string;
        date_from: string;
        date_to: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Penjualan', href: '/sales' },
    { title: 'Transaksi', href: '/sales/transactions' },
];

export default function SalesTransactionIndex() {
    const { transactions, stores, stats, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [dateFrom, setDateFrom] = useState(initialFilters?.date_from || '');
    const [dateTo, setDateTo] = useState(initialFilters?.date_to || '');
    const [showFilters, setShowFilters] = useState(false);
    const [voidDialog, setVoidDialog] = useState<{
        open: boolean;
        transaction: SalesTransactionData | null;
    }>({
        open: false,
        transaction: null,
    });

    // Prepare options for searchable selects
    const storeOptions = [
        { value: 'all', label: 'All Stores' },
        ...stores.map(store => ({
            value: store.id.toString(),
            label: store.name
        }))
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'voided', label: 'Voided' }
    ];

    const handleSearch = (value: string) => {
        router.get('/sales/transactions', {
            search: value,
            store_id: storeId === 'all' ? '' : storeId,
            status: status === 'all' ? '' : status,
            date_from: dateFrom,
            date_to: dateTo,
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/sales/transactions', {
            search: search,
            store_id: storeId === 'all' ? '' : storeId,
            status: status === 'all' ? '' : status,
            date_from: dateFrom,
            date_to: dateTo,
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStoreId('all');
        setStatus('all');
        setDateFrom('');
        setDateTo('');
        router.get('/sales/transactions', {
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            case 'refunded':
                return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
            case 'voided':
                return <Badge className="bg-gray-100 text-gray-800">Voided</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
            case 'partial':
                return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
            case 'pending':
                return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
            case 'overpaid':
                return <Badge className="bg-blue-100 text-blue-800">Overpaid</Badge>;
            default:
                return <Badge variant="outline">{paymentStatus}</Badge>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleVoidTransaction = (transaction: SalesTransactionData) => {
        setVoidDialog({ open: true, transaction });
    };

    const handleVoidConfirm = () => {
        if (voidDialog.transaction) {
            router.post(`/sales/transactions/${voidDialog.transaction.id}/void`, {}, {
                onSuccess: () => {
                    toast.success('Transaction voided successfully');
                    setVoidDialog({ open: false, transaction: null });
                },
                onError: () => {
                    toast.error('Failed to void transaction');
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Penjualan" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transaksi Penjualan
                    </CardTitle>
                    <CardDescription>
                        Kelola transaksi penjualan dan pantau status pembayaran
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Filter Section */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSearch(search);
                                }}
                                className="flex flex-1 items-center gap-2"
                            >
                                <Input
                                    type="text"
                                    placeholder="Cari transaksi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 md:w-[300px] md:flex-none"
                                />
                                <Button type="submit" size="sm" className="shrink-0 flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cari</span>
                                </Button>
                            </form>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filter</span>
                                </Button>
                                <PermissionGate permission="sales.create">
                                    <Button 
                                        className="flex-1 sm:flex-none justify-center flex items-center gap-2"
                                        onClick={() => router.visit('/sales/transactions/create')}
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline">Transaksi Baru</span>
                                        <span className="sm:hidden">Baru</span>
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Transactions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Store</label>
                                            <SearchableSelect
                                                value={storeId}
                                                onValueChange={setStoreId}
                                                options={storeOptions}
                                                placeholder="Select store"
                                                emptyText="No store found"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Status</label>
                                            <SearchableSelect
                                                value={status}
                                                onValueChange={setStatus}
                                                options={statusOptions}
                                                placeholder="Select status"
                                                emptyText="No status found"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Date From</label>
                                            <Input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Date To</label>
                                            <Input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="flex items-end gap-2">
                                            <Button 
                                                onClick={handleFilter} 
                                                className="flex items-center gap-2"
                                            >
                                                <Filter className="h-4 w-4" />
                                                Apply
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-2"
                                            >
                                                <X className="h-4 w-4" />
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    <div className="mt-6 w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <TableHead>Transaction #</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Payment</TableHead>
                                    <TableHead className="w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.length > 0 ? (
                                    transactions.data.map((transaction, index) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>{(transactions.current_page - 1) * transactions.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{transaction.transaction_number}</div>
                                                    {transaction.reference_number && (
                                                        <div className="text-sm text-muted-foreground">
                                                            Ref: {transaction.reference_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{transaction.store.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                {transaction.customer ? (
                                                    <div>
                                                        <div className="font-medium">{transaction.customer.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {transaction.customer.code}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Walk-in Customer</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{formatDateTime(transaction.transaction_date)}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                <span className="font-semibold">
                                                    {formatCurrency(transaction.total_amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(transaction.status)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getPaymentStatusBadge(transaction.payment_status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <PermissionGate permission="sales.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/sales/transactions/${transaction.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    {transaction.status === 'pending' && (
                                                        <PermissionGate permission="sales.edit">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-yellow-600 hover:bg-yellow-50"
                                                                onClick={() => router.visit(`/sales/transactions/${transaction.id}/edit`)}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                        </PermissionGate>
                                                    )}
                                                    {transaction.status === 'completed' && (
                                                        <PermissionGate permission="sales.view">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-green-600 hover:bg-green-50"
                                                                onClick={() => router.visit(`/sales/transactions/${transaction.id}/receipt`)}
                                                            >
                                                                <Receipt className="h-4 w-4" />
                                                            </Button>
                                                        </PermissionGate>
                                                    )}
                                                    {transaction.status === 'completed' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleVoidTransaction(transaction)}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {transactions.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {((transactions.current_page - 1) * transactions.per_page) + 1} - {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of {transactions.total} transactions
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={transactions.current_page === 1}
                                    onClick={() => router.visit(`/sales/transactions?page=${transactions.current_page - 1}`)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={transactions.current_page === transactions.last_page}
                                    onClick={() => router.visit(`/sales/transactions?page=${transactions.current_page + 1}`)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Void Transaction Dialog */}
            <Dialog open={voidDialog.open} onOpenChange={(open) => setVoidDialog({ open, transaction: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void Transaction</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to void this transaction? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {voidDialog.transaction && (
                        <div className="py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Transaction #:</span>
                                    <span className="font-medium">{voidDialog.transaction.transaction_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Amount:</span>
                                    <span className="font-medium">{formatCurrency(voidDialog.transaction.total_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span className="font-medium">{formatDateTime(voidDialog.transaction.transaction_date)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVoidDialog({ open: false, transaction: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleVoidConfirm}>
                            Void Transaction
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
