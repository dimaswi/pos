import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Search, Filter, X, Plus, Eye, Edit3, Trash2, Percent, Tag, TrendingUp, Activity } from 'lucide-react';
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

interface DiscountData {
    id: number;
    name: string;
    code: string;
    type: 'percentage' | 'fixed' | 'buy_x_get_y';
    value: number;
    store_id: number | null;
    description: string | null;
    minimum_amount: number | null;
    maximum_discount: number | null;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    usage_count: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    apply_to_sale_items: boolean;
    minimum_quantity: number | null;
    get_quantity: number | null;
    store: StoreData | null;
}

interface StatsData {
    total_discounts: number;
    active_discounts: number;
    expired_discounts: number;
    total_usage: number;
}

interface PaginatedDiscounts {
    data: DiscountData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    discounts: PaginatedDiscounts;
    stores: StoreData[];
    stats: StatsData;
    filters?: {
        search: string;
        store_id: string;
        type: string;
        status: string;
        perPage: number;
    };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Penjualan', href: '/sales' },
    { title: 'Diskon', href: '/sales/discounts' },
];

export default function DiscountIndex() {
    const { discounts, stores, stats, filters: initialFilters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [storeId, setStoreId] = useState(initialFilters?.store_id || 'all');
    const [type, setType] = useState(initialFilters?.type || 'all');
    const [status, setStatus] = useState(initialFilters?.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        discount: DiscountData | null;
    }>({
        open: false,
        discount: null,
    });

    // Prepare options for searchable selects
    const storeOptions = [
        { value: 'all', label: 'All Stores' },
        ...stores.map(store => ({
            value: store.id.toString(),
            label: store.name
        }))
    ];

    const typeOptions = [
        { value: 'all', label: 'All Types' },
        { value: 'percentage', label: 'Percentage' },
        { value: 'fixed', label: 'Fixed Amount' },
        { value: 'buy_x_get_y', label: 'Buy X Get Y' },
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'expired', label: 'Expired' },
    ];

    const handleSearch = (value: string) => {
        router.get('/sales/discounts', {
            search: value,
            store_id: storeId === 'all' ? '' : storeId,
            type: type === 'all' ? '' : type,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = () => {
        router.get('/sales/discounts', {
            search: search,
            store_id: storeId === 'all' ? '' : storeId,
            type: type === 'all' ? '' : type,
            status: status === 'all' ? '' : status,
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStoreId('all');
        setType('all');
        setStatus('all');
        router.get('/sales/discounts', {
            perPage: initialFilters?.perPage || 15,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleToggleStatus = (discount: DiscountData) => {
        router.post(`/sales/discounts/${discount.id}/toggle-status`, {}, {
            onSuccess: () => {
                toast.success(`Discount ${discount.is_active ? 'deactivated' : 'activated'} successfully`);
            },
            onError: () => {
                toast.error('Failed to update discount status');
            }
        });
    };

    const handleDelete = (discount: DiscountData) => {
        setDeleteDialog({ open: true, discount });
    };

    const handleDeleteConfirm = () => {
        if (deleteDialog.discount) {
            router.delete(`/sales/discounts/${deleteDialog.discount.id}`, {
                onSuccess: () => {
                    toast.success('Discount deleted successfully');
                    setDeleteDialog({ open: false, discount: null });
                },
                onError: () => {
                    toast.error('Failed to delete discount');
                }
            });
        }
    };

    const getTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            'percentage': 'bg-blue-100 text-blue-800',
            'fixed': 'bg-green-100 text-green-800',
            'buy_x_get_y': 'bg-purple-100 text-purple-800',
        };

        const typeLabels: Record<string, string> = {
            'percentage': 'Percentage',
            'fixed': 'Fixed Amount',
            'buy_x_get_y': 'Buy X Get Y',
        };

        return (
            <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
                {typeLabels[type] || type}
            </Badge>
        );
    };

    const getStatusBadge = (discount: DiscountData) => {
        const now = new Date();
        const startDate = new Date(discount.start_date);
        const endDate = discount.end_date ? new Date(discount.end_date) : null;

        if (!discount.is_active) {
            return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
        }

        if (startDate > now) {
            return <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
        }

        if (endDate && endDate < now) {
            return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
        }

        if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
            return <Badge className="bg-orange-100 text-orange-800">Usage Limit Reached</Badge>;
        }

        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    };

    const getValueDisplay = (discount: DiscountData) => {
        switch (discount.type) {
            case 'percentage':
                return `${discount.value}%`;
            case 'fixed':
                return formatCurrency(discount.value);
            case 'buy_x_get_y':
                return `Buy ${discount.minimum_quantity || 1} Get ${discount.get_quantity || 1}`;
            default:
                return discount.value.toString();
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Discounts" />

            <Card className='mt-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Discounts & Promotions
                    </CardTitle>
                    <CardDescription>
                        Manage discount codes and promotional offers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Filter Section */}
                        <div className="flex items-center justify-between gap-4">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSearch(search);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    type="text"
                                    placeholder="Search discounts..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-[300px]"
                                />
                                <Button type="submit" size="sm" className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Search
                                </Button>
                            </form>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-2"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                                <PermissionGate permission="discount.create">
                                    <Button 
                                        className="flex items-center gap-2"
                                        onClick={() => router.visit('/sales/discounts/create')}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Discount
                                    </Button>
                                </PermissionGate>
                            </div>
                        </div>

                        {/* Filter Section */}
                        {showFilters && (
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Filter Discounts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                            <label className="text-sm font-medium mb-2 block">Type</label>
                                            <SearchableSelect
                                                value={type}
                                                onValueChange={setType}
                                                options={typeOptions}
                                                placeholder="Select type"
                                                emptyText="No type found"
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
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-center">Usage</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discounts.data.length > 0 ? (
                                    discounts.data.map((discount, index) => (
                                        <TableRow key={discount.id}>
                                            <TableCell>{(discounts.current_page - 1) * discounts.per_page + index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{discount.name}</div>
                                                    <div className="text-sm text-muted-foreground font-mono">
                                                        {discount.code}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getTypeBadge(discount.type)}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {getValueDisplay(discount)}
                                            </TableCell>
                                            <TableCell>
                                                {discount.store ? (
                                                    <span className="font-medium">{discount.store.name}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">All Stores</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{formatDate(discount.start_date)}</div>
                                                    {discount.end_date && (
                                                        <div className="text-muted-foreground">
                                                            to {formatDate(discount.end_date)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="text-sm">
                                                    <div className="font-semibold">{discount.usage_count}</div>
                                                    {discount.usage_limit && (
                                                        <div className="text-muted-foreground">
                                                            / {discount.usage_limit}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {getStatusBadge(discount)}
                                                    <PermissionGate permission="discount.edit" fallback={
                                                        <Switch
                                                            checked={discount.is_active}
                                                            disabled={true}
                                                        />
                                                    }>
                                                        <Switch
                                                            checked={discount.is_active}
                                                            onCheckedChange={() => handleToggleStatus(discount)}
                                                        />
                                                    </PermissionGate>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <PermissionGate permission="discount.view">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/sales/discounts/${discount.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="discount.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            onClick={() => router.visit(`/sales/discounts/${discount.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGate>
                                                    <PermissionGate permission="discount.delete">
                                                        {discount.usage_count === 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDelete(discount)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </PermissionGate>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No discounts found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {discounts.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {((discounts.current_page - 1) * discounts.per_page) + 1} - {Math.min(discounts.current_page * discounts.per_page, discounts.total)} of {discounts.total} discounts
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={discounts.current_page === 1}
                                    onClick={() => router.visit(`/sales/discounts?page=${discounts.current_page - 1}`)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={discounts.current_page === discounts.last_page}
                                    onClick={() => router.visit(`/sales/discounts?page=${discounts.current_page + 1}`)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Discount Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, discount: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Discount</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this discount? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteDialog.discount && (
                        <div className="py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Name:</span>
                                    <span className="font-medium">{deleteDialog.discount.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Code:</span>
                                    <span className="font-medium font-mono">{deleteDialog.discount.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span className="font-medium">{deleteDialog.discount.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Usage Count:</span>
                                    <span className="font-medium">{deleteDialog.discount.usage_count || 0}</span>
                                </div>
                            </div>
                            {deleteDialog.discount.usage_count > 0 && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                    <div className="text-sm text-red-800">
                                        <strong>Warning:</strong> This discount has been used {deleteDialog.discount.usage_count} time(s). 
                                        Deleting it may affect transaction records.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, discount: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete Discount
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
