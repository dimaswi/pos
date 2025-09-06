import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Search, X, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Customer {
    id: number;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    customer_discount_id?: number;
    customer_discount?: {
        id: number;
        name: string;
        discount_percentage: number;
        minimum_purchase: number;
        maximum_discount?: number;
    };
}

interface Props {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
    onAddCustomer: () => void;
}

export default function CustomerSelect({ 
    customers: initialCustomers, 
    selectedCustomer, 
    onSelectCustomer, 
    onAddCustomer 
}: Props) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [loading, setLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Search customers with debounce
    const searchCustomers = async (searchTerm: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/pos/cashier/search-customers?search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle search with debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchCustomers(search);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search]);

    // Load initial customers when component mounts or opens
    useEffect(() => {
        if (open && customers.length === 0) {
            searchCustomers('');
        }
    }, [open]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.code.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectCustomer = (customer: Customer) => {
        onSelectCustomer(customer);
        setOpen(false);
        setSearch('');
    };

    const handleClearCustomer = () => {
        onSelectCustomer(null);
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Pelanggan</span>
            </div>

            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="flex-1 justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        >
                            {selectedCustomer ? (
                                <span className="truncate">{selectedCustomer.name}</span>
                            ) : (
                                <span className="text-gray-500">Pilih pelanggan...</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    
                    <PopoverContent className="w-80 bg-white border-gray-200" align="start">
                        <div className="space-y-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                {loading && (
                                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                                )}
                                <Input
                                    placeholder="Cari pelanggan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 pr-10 bg-white border-gray-300 text-gray-900"
                                />
                            </div>

                            {/* Customer List */}
                            <div className="max-h-60 overflow-auto space-y-1">
                                {loading ? (
                                    <div className="text-center py-4 text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Mencari pelanggan...
                                    </div>
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => (
                                        <Button
                                            key={customer.id}
                                            variant="ghost"
                                            className="w-full justify-start p-3 h-auto hover:bg-gray-50"
                                            onClick={() => handleSelectCustomer(customer)}
                                        >
                                            <div className="text-left w-full">
                                                <div className="font-medium text-gray-900">
                                                    {customer.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {customer.code}
                                                    {customer.phone && ` • ${customer.phone}`}
                                                </div>
                                                {customer.customer_discount && (
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="mt-1 text-xs bg-blue-100 text-blue-700"
                                                    >
                                                        {customer.customer_discount.name} ({customer.customer_discount.discount_percentage}%)
                                                    </Badge>
                                                )}
                                            </div>
                                        </Button>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        {search ? 'Pelanggan tidak ditemukan' : 'Tidak ada pelanggan'}
                                    </div>
                                )}
                            </div>

                            {/* Add New Customer */}
                            <div className="border-t border-gray-200 pt-3">
                                <Button
                                    onClick={() => {
                                        onAddCustomer();
                                        setOpen(false);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Pelanggan Baru
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Clear Selection */}
                {selectedCustomer && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCustomer}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Selected Customer Info */}
            {selectedCustomer && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200 mt-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{selectedCustomer.name}</span>
                        <span className="text-gray-500">{selectedCustomer.code}</span>
                    </div>
                    
                    {selectedCustomer.phone && (
                        <div className="text-gray-600 mb-1">📞 {selectedCustomer.phone}</div>
                    )}
                    
                    {selectedCustomer.customer_discount && (
                        <Badge 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-700"
                        >
                            Member: {selectedCustomer.customer_discount.name} ({selectedCustomer.customer_discount.discount_percentage}%)
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
