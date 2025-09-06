import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Eye, 
    Receipt, 
    User, 
    CreditCard,
    Package,
    Clock,
    ArrowLeft,
    Calendar,
    Filter,
    RefreshCw,
    X
} from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
    id: number;
    transaction_number: string;
    transaction_date: string;
    customer?: {
        id: number;
        name: string;
        code: string;
    };
    user: {
        id: number;
        name: string;
    };
    total_amount: number;
    status: string;
    payment_status: string;
    sales_items_count?: number;
}

interface TransactionDetail {
    id: number;
    transaction_number: string;
    transaction_date: string;
    customer?: {
        id: number;
        name: string;
        code: string;
    };
    user: {
        id: number;
        name: string;
    };
    total_amount: number;
    discount_amount: number;
    tax_amount: number;
    paid_amount: number;  // Added paid_amount from database
    change_amount: number;  // Added change_amount from database
    grand_total: number;  // Added grand_total for final amount
    status: string;
    payment_status: string;
    sales_items: Array<{
        id: number;
        product: {
            id: number;
            name: string;
            sku: string;
        };
        quantity: number;
        unit_price: number;
        total_amount: number;  // Changed from total_price to total_amount
        discount_amount: number;
    }>;
    payments: Array<{
        id: number;
        payment_method: {
            id: number;
            name: string;
        };
        amount: number;
        payment_date: string;
    }>;
}

interface TransactionHistoryModalProps {
    open: boolean;
    onClose: () => void;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ open, onClose }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');

    const fetchTransactions = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: '5',
                search: searchTerm,
                start_date: startDate,
                end_date: endDate,
                payment_status: paymentStatus,
            });

            const response = await fetch(`/pos/cashier/transaction-history?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Transaction history response:', data);

            if (data.success) {
                setTransactions(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            } else {
                toast.error('Gagal memuat riwayat transaksi');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionDetail = async (transactionId: number) => {
        try {
            setDetailLoading(true);
            const response = await fetch(`/pos/cashier/transaction/${transactionId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Transaction detail response:', data);

            if (data.success) {
                setSelectedTransaction(data.data);
                setActiveTab('detail');
            } else {
                toast.error('Gagal memuat detail transaksi');
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            toast.error('Terjadi kesalahan saat memuat detail');
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            // Reset to list view when opening modal
            setActiveTab('list');
            setSelectedTransaction(null);
            fetchTransactions(1);
        }
    }, [open, searchTerm, startDate, endDate, paymentStatus]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchTransactions(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchTransactions(page);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setPaymentStatus('');
        setCurrentPage(1);
        // Fetch data with cleared filters
        setTimeout(() => {
            fetchTransactions(1);
        }, 100);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            completed: { label: 'Selesai', variant: 'default' as const },
            pending: { label: 'Pending', variant: 'secondary' as const },
            cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || 
                      { label: status, variant: 'outline' as const };
        
        return (
            <Badge variant={config.variant} className="text-xs">
                {config.label}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            paid: { label: 'Lunas', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
            partial: { label: 'Sebagian', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
            unpaid: { label: 'Belum Bayar', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || 
                      { label: status, variant: 'outline' as const, className: '' };
        
        return (
            <Badge variant={config.variant} className={`text-xs ${config.className}`}>
                {config.label}
            </Badge>
        );
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
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={onClose}
                    ></div>
                    
                    {/* Modal */}
                    <div className="relative bg-white w-[98vw] h-[98vh] rounded-lg shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
                            <div className="text-lg">
                                {activeTab === 'detail' && selectedTransaction ? (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => setActiveTab('list')}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <div>
                                            <span className="text-lg font-semibold">Detail Transaksi</span>
                                            <p className="text-sm text-gray-600 font-normal">
                                                {selectedTransaction.transaction_number}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-blue-600" />
                                        Riwayat Transaksi
                                    </div>
                                )}
                            </div>
                            
                            {/* Close Button */}
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="overflow-auto h-[calc(98vh-70px)] px-6 py-4">
                            {activeTab === 'list' ? (
                                <div className="space-y-4">
                                    {/* Filter Section */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                            {/* Search */}
                                            <div>
                                                <Input
                                                    placeholder="Cari transaksi..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>

                                            {/* Start Date */}
                                            <div>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>

                                            {/* End Date */}
                                            <div>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>

                                            {/* Payment Status */}
                                            <div>
                                                <select
                                                    value={paymentStatus}
                                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                                    className="w-full h-8 text-sm px-3 py-1 border border-gray-300 rounded-md bg-white"
                                                >
                                                    <option value="">Semua Status</option>
                                                    <option value="paid">Lunas</option>
                                                    <option value="partial">Sebagian</option>
                                                    <option value="unpaid">Belum Bayar</option>
                                                </select>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleSearch}
                                                    size="sm"
                                                    className="h-8 px-3 text-sm"
                                                    disabled={loading}
                                                >
                                                    <Search className="h-3 w-3 mr-1" />
                                                    Cari
                                                </Button>
                                                <Button
                                                    onClick={clearFilters}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 text-sm"
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="text-sm text-gray-600">
                                        Menampilkan {transactions.length} dari {total} transaksi
                                    </div>

                                    {/* Transactions List */}
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {transactions.map((transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer bg-white relative"
                                                    onClick={() => fetchTransactionDetail(transaction.id)}
                                                    title="Klik untuk melihat detail transaksi"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Receipt className="h-4 w-4 text-blue-600" />
                                                                <span className="font-semibold text-sm">
                                                                    {transaction.transaction_number}
                                                                </span>
                                                                {getStatusBadge(transaction.status)}
                                                                {getPaymentStatusBadge(transaction.payment_status)}
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        Tanggal
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        {formatDate(transaction.transaction_date)}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                                        <User className="h-3 w-3" />
                                                                        Customer
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        {transaction.customer?.name || 'Walk-in Customer'}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                                        <Package className="h-3 w-3" />
                                                                        Items
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        {transaction.sales_items_count || 0} item
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                                        <CreditCard className="h-3 w-3" />
                                                                        Total
                                                                    </div>
                                                                    <div className="font-semibold text-green-600">
                                                                        {formatCurrency(transaction.total_amount)}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 text-xs text-gray-500">
                                                                Kasir: {transaction.user.name}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fetchTransactionDetail(transaction.id);
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="ml-4 h-8 px-3 text-sm"
                                                            disabled={detailLoading}
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Detail
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {transactions.length === 0 && (
                                                <div className="text-center py-12 text-gray-500">
                                                    <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                    <p>Tidak ada transaksi ditemukan</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 mt-6">
                                            <Button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-sm"
                                            >
                                                Previous
                                            </Button>
                                            
                                            <div className="flex gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <Button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-sm"
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                            </div>

                                            <Button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-sm"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Transaction Detail View
                                <div className="space-y-4">
                                    {detailLoading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : selectedTransaction && (
                                        <>
                                            {/* Transaction Info Header */}
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">No. Transaksi</label>
                                                        <div className="font-medium text-gray-900">
                                                            {selectedTransaction.transaction_number}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Tanggal</label>
                                                        <div className="font-medium text-gray-900">
                                                            {formatDate(selectedTransaction.transaction_date)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Kasir</label>
                                                        <div className="font-medium text-gray-900">
                                                            {selectedTransaction.user.name}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Status</label>
                                                        <div className="flex gap-1">
                                                            {getStatusBadge(selectedTransaction.status)}
                                                            {getPaymentStatusBadge(selectedTransaction.payment_status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Nama</label>
                                                        <div className="font-medium text-gray-900">
                                                            {selectedTransaction.customer?.name || 'Walk-in Customer'}
                                                        </div>
                                                    </div>
                                                    {selectedTransaction.customer && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Kode</label>
                                                            <div className="font-medium text-gray-900">
                                                                {selectedTransaction.customer.code}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        Detail Item ({selectedTransaction.sales_items.length})
                                                    </h3>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Produk</th>
                                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Qty</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Harga</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Diskon</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {selectedTransaction.sales_items.map((item) => (
                                                                <tr key={item.id} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-3">
                                                                        <div>
                                                                            <div className="font-medium text-gray-900 text-xs">
                                                                                {item.product.name}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {item.product.sku}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center text-xs">
                                                                        {item.quantity}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right text-xs font-medium">
                                                                        {formatCurrency(item.unit_price)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right text-xs">
                                                                        {item.discount_amount > 0 ? (
                                                                            <span className="text-red-600">
                                                                                -{formatCurrency(item.discount_amount)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right text-xs font-semibold">
                                                                        {formatCurrency(item.total_amount)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Summary Section */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {/* Financial Summary */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Ringkasan</h3>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Subtotal:</span>
                                                            <span className="font-medium">
                                                                {formatCurrency(selectedTransaction.total_amount)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Diskon:</span>
                                                            <span className="font-medium text-red-600">
                                                                -{formatCurrency(selectedTransaction.discount_amount)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Pajak:</span>
                                                            <span className="font-medium">
                                                                {formatCurrency(selectedTransaction.tax_amount)}
                                                            </span>
                                                        </div>
                                                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                                                            <span className="font-semibold text-gray-900">Grand Total:</span>
                                                            <span className="font-bold text-green-600">
                                                                {formatCurrency(selectedTransaction.grand_total || selectedTransaction.total_amount)}
                                                            </span>
                                                        </div>
                                                        {selectedTransaction.paid_amount !== undefined && (
                                                            <>
                                                                <div className="flex justify-between pt-1">
                                                                    <span className="text-gray-600">Dibayar:</span>
                                                                    <span className="font-medium text-blue-600">
                                                                        {formatCurrency(selectedTransaction.paid_amount)}
                                                                    </span>
                                                                </div>
                                                                {selectedTransaction.change_amount > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Kembalian:</span>
                                                                        <span className="font-medium text-orange-600">
                                                                            {formatCurrency(selectedTransaction.change_amount)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Payment Methods */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Pembayaran</h3>
                                                    <div className="space-y-2">
                                                        {selectedTransaction.payments.length > 0 ? selectedTransaction.payments.map((payment) => (
                                                            <div key={payment.id} className="bg-gray-50 rounded-md p-3">
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">
                                                                            {payment.payment_method.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {formatDate(payment.payment_date)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="font-semibold text-green-600">
                                                                        {formatCurrency(payment.amount)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                                <p>Belum ada pembayaran</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TransactionHistoryModal;
