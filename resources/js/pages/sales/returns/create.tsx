import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Search, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/layouts/app-layout';
import { toast } from 'sonner';
import axios from 'axios';

interface Store {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface SalesItem {
    id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
    available_for_return?: number; // Available quantity for return
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

interface SalesTransaction {
    id: number;
    transaction_number: string;
    transaction_date: string;
    customer?: Customer;
    store: Store;
    total_amount: number;
    sales_items: SalesItem[];
}

interface ReturnItem {
    sales_item_id: number;
    quantity: number;
    reason: string;
    condition: 'good' | 'damaged' | 'defective';
    max_quantity: number;
    product_name: string;
    unit_price: number;
}

interface Props {
    stores: Store[];
    transaction?: SalesTransaction;
}

export default function Create({ stores, transaction }: Props) {
    const { props } = usePage();
    const [searchTransaction, setSearchTransaction] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<SalesTransaction | null>(transaction || null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        sales_transaction_id: transaction?.id || '',
        store_id: transaction?.store.id || '',
        return_date: new Date().toISOString().split('T')[0],
        reason: '',
        return_items: [] as any[],
    });

    const searchForTransaction = async () => {
        if (!searchTransaction.trim()) {
            toast.error('Harap masukkan nomor transaksi');
            return;
        }

        setIsSearching(true);
        try {
            // Get CSRF token from Inertia page props
            const csrfToken = (props as any).csrf_token;
            
            if (!csrfToken) {
                throw new Error('CSRF token tidak ditemukan');
            }

            const response = await fetch(route('sales.returns.get-transaction'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    transaction_number: searchTransaction,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Check if transaction has any available items for return
                const hasAvailableItems = result.transaction.sales_items.some((item: any) => 
                    (item.available_for_return || item.quantity) > 0
                );

                if (!hasAvailableItems) {
                    toast.error('Semua barang dari transaksi ini sudah diretur semua. Tidak dapat membuat retur baru.');
                    setSelectedTransaction(null);
                    setReturnItems([]);
                    return;
                }

                // Check if transaction has pending returns
                if (result.has_pending_returns) {
                    toast.error('Transaksi ini sudah memiliki permintaan retur yang sedang menunggu persetujuan. Tidak dapat membuat retur baru sampai retur sebelumnya diproses.');
                    setSelectedTransaction(null);
                    setReturnItems([]);
                    return;
                }

                // Additional check: if all items have 0 available_for_return
                const totalAvailableItems = result.transaction.sales_items.reduce((total: number, item: any) => {
                    return total + (item.available_for_return || 0);
                }, 0);

                if (totalAvailableItems === 0) {
                    toast.error('Transaksi ini tidak memiliki barang yang dapat diretur. Semua barang sudah pernah diretur.');
                    setSelectedTransaction(null);
                    setReturnItems([]);
                    return;
                }

                setSelectedTransaction(result.transaction);
                setData('sales_transaction_id', result.transaction.id);
                setData('store_id', result.transaction.store.id);
                initializeReturnItems(result.transaction);
                
                if (result.existing_returns_count > 0) {
                    toast.warning(`Transaksi ini sudah memiliki ${result.existing_returns_count} retur yang ada. Hanya barang yang belum diretur yang dapat dipilih.`);
                } else {
                    toast.success('Transaksi ditemukan');
                }
            } else {
                toast.error(result.message || 'Transaksi tidak ditemukan');
                setSelectedTransaction(null);
                setReturnItems([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Gagal mencari transaksi. Silakan coba lagi.');
            setSelectedTransaction(null);
            setReturnItems([]);
        } finally {
            setIsSearching(false);
        }
    };

    const initializeReturnItems = (transaction: SalesTransaction) => {
        const items: ReturnItem[] = transaction.sales_items.map(item => ({
            sales_item_id: item.id,
            quantity: 0,
            reason: '',
            condition: 'good' as const,
            max_quantity: item.available_for_return || item.quantity,
            product_name: item.product.name,
            unit_price: Number(item.unit_price) - Number(item.discount_amount),
        }));
        
        // Check if any items are available for return
        const hasAvailableItems = items.some(item => item.max_quantity > 0);
        if (!hasAvailableItems) {
            toast.warning('Semua barang dari transaksi ini sudah diretur');
        }
        
        setReturnItems(items);
    };

    const updateReturnItem = (index: number, field: keyof ReturnItem, value: any) => {
        const updatedItems = [...returnItems];
        
        // Validate quantity doesn't exceed max_quantity
        if (field === 'quantity') {
            const maxQuantity = updatedItems[index].max_quantity;
            const quantity = parseInt(value) || 0;
            
            if (quantity > maxQuantity) {
                toast.error(`Jumlah retur tidak boleh melebihi ${maxQuantity} barang yang tersedia`);
                return;
            }
            
            if (quantity < 0) {
                toast.error('Jumlah retur tidak boleh kurang dari 0');
                return;
            }
            
            updatedItems[index] = { ...updatedItems[index], [field]: quantity };
        } else {
            updatedItems[index] = { ...updatedItems[index], [field]: value };
        }
        
        setReturnItems(updatedItems);
        
        // Update form data
        const validItems = updatedItems.filter(item => item.quantity > 0);
        setData('return_items', validItems);
    };

    const removeReturnItem = (index: number) => {
        const updatedItems = returnItems.filter((_, i) => i !== index);
        setReturnItems(updatedItems);
        
        const validItems = updatedItems.filter(item => item.quantity > 0);
        setData('return_items', validItems);
    };

    const getTotalRefundAmount = () => {
        return returnItems.reduce((total, item) => {
            return total + (item.quantity * Number(item.unit_price));
        }, 0);
    };

    const getTotalReturnItems = () => {
        return returnItems.reduce((total, item) => total + item.quantity, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const validItems = returnItems.filter(item => 
            item.quantity > 0 && 
            item.reason.trim() !== ''
        );

        if (validItems.length === 0) {
            toast.error('Harap tambahkan minimal satu barang untuk diretur dengan alasan yang jelas');
            return;
        }

        // Additional validation: check if any item quantity exceeds available quantity
        const invalidItems = validItems.filter(item => item.quantity > item.max_quantity);
        if (invalidItems.length > 0) {
            toast.error('Beberapa barang melebihi jumlah yang tersedia untuk diretur');
            return;
        }

        // Check if total return quantity is 0
        const totalReturnQuantity = validItems.reduce((total, item) => total + item.quantity, 0);
        if (totalReturnQuantity === 0) {
            toast.error('Minimal harus ada 1 barang untuk diretur');
            return;
        }

        // Check if all items have max_quantity > 0 (prevent creating return for fully returned transaction)
        const hasValidItems = validItems.some(item => item.max_quantity > 0);
        if (!hasValidItems) {
            toast.error('Tidak dapat membuat retur untuk transaksi yang semua barangnya sudah diretur');
            return;
        }

        // Show confirmation dialog
        setShowSubmitConfirmation(true);
    };

    const confirmSubmit = () => {
        const validItems = returnItems.filter(item => 
            item.quantity > 0 && 
            item.reason.trim() !== ''
        );

        setData('return_items', validItems);
        
        post(route('sales.returns.store'), {
            onSuccess: () => {
                toast.success('Permintaan retur berhasil dibuat');
                setShowSubmitConfirmation(false);
            },
            onError: (errors) => {
                console.error('Submit errors:', errors);
                setShowSubmitConfirmation(false);
                if (errors.sales_transaction_id) {
                    toast.error('Transaksi tidak valid atau sudah memiliki retur untuk semua barang');
                } else if (errors.return_items) {
                    toast.error('Ada masalah dengan barang retur yang dipilih');
                } else if (errors.duplicate_return) {
                    toast.error('Tidak dapat membuat retur duplikat untuk transaksi ini');
                } else {
                    toast.error('Gagal membuat permintaan retur. Silakan periksa data dan coba lagi.');
                }
            }
        });
    };

    useEffect(() => {
        if (transaction) {
            initializeReturnItems(transaction);
        }
    }, [transaction]);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Penjualan', href: '#' },
                { title: 'Retur', href: route('sales.returns.index') },
                { title: 'Retur Baru', href: route('sales.returns.create') }
            ]}
        >
            <Head title="Buat Retur" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={route('sales.returns.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Kembali
                                </Button>
                            </Link>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Buat Permintaan Retur
                            </h2>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Search Transaction */}
                        {!selectedTransaction && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cari Transaksi</CardTitle>
                                    <CardDescription>
                                        Masukkan nomor transaksi untuk membuat permintaan retur
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Masukkan nomor transaksi..."
                                                value={searchTransaction}
                                                onChange={(e) => setSearchTransaction(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && searchForTransaction()}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={searchForTransaction}
                                            disabled={isSearching}
                                        >
                                            <Search className="w-4 h-4 mr-2" />
                                            {isSearching ? 'Mencari...' : 'Cari'}
                                        </Button>
                                        {selectedTransaction && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedTransaction(null);
                                                    setReturnItems([]);
                                                    setSearchTransaction('');
                                                    setData('sales_transaction_id', '');
                                                    setData('store_id', '');
                                                }}
                                            >
                                                Bersihkan
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Transaction Details */}
                        {selectedTransaction && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Transaksi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Nomor Transaksi</Label>
                                            <p className="text-lg font-semibold">{selectedTransaction.transaction_number}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Pelanggan</Label>
                                            <p className="text-lg">{selectedTransaction.customer?.name || 'Tamu'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Toko</Label>
                                            <p className="text-lg">{selectedTransaction.store.name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Tanggal Transaksi</Label>
                                            <p className="text-lg">{new Date(selectedTransaction.transaction_date).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: '2-digit', 
                                                year: 'numeric'
                                            })}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Total Harga</Label>
                                            <p className="text-lg font-semibold">Rp {Number(selectedTransaction.total_amount).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Warning for existing returns */}
                                    {returnItems.some(item => item.max_quantity < (selectedTransaction.sales_items.find(si => si.product.name === item.product_name)?.quantity || 0)) && (
                                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                            <div className="flex items-start">
                                                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-orange-800">Peringatan Retur Sebelumnya</h4>
                                                    <p className="text-sm text-orange-700 mt-1">
                                                        Transaksi ini sudah memiliki retur sebelumnya. Hanya barang yang belum pernah diretur yang tersedia untuk retur baru.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Return Details */}
                        {selectedTransaction && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Retur</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="return_date">Tanggal Retur</Label>
                                            <Input
                                                id="return_date"
                                                type="date"
                                                value={data.return_date as string}
                                                onChange={(e) => setData('return_date', e.target.value)}
                                                required
                                            />
                                            {errors.return_date && (
                                                <p className="text-sm text-red-600 mt-1">{errors.return_date}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="reason">Alasan Retur</Label>
                                        <Textarea
                                            id="reason"
                                            placeholder="Jelaskan alasan untuk retur ini..."
                                            value={data.reason as string}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            rows={3}
                                            required
                                        />
                                        {errors.reason && (
                                            <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Return Items */}
                        {selectedTransaction && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Barang untuk Diretur</CardTitle>
                                    <CardDescription>
                                        Pilih barang yang ingin diretur dan tentukan jumlah serta kondisinya
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {returnItems.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Memuat data barang...</p>
                                        </div>
                                    ) : returnItems.every(item => item.max_quantity === 0) ? (
                                        <div className="text-center py-8">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                                    Tidak Ada Barang yang Dapat Diretur
                                                </h3>
                                                <p className="text-yellow-700">
                                                    Semua barang dari transaksi ini sudah diretur semua. 
                                                    Silakan pilih transaksi lain untuk membuat retur baru.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => {
                                                        setSelectedTransaction(null);
                                                        setReturnItems([]);
                                                        setSearchTransaction('');
                                                        setData('sales_transaction_id', '');
                                                        setData('store_id', '');
                                                    }}
                                                >
                                                    Pilih Transaksi Lain
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Produk</TableHead>
                                                        <TableHead>Qty Tersedia</TableHead>
                                                        <TableHead>Qty Retur</TableHead>
                                                        <TableHead>Harga Satuan</TableHead>
                                                        <TableHead>Kondisi</TableHead>
                                                        <TableHead>Alasan</TableHead>
                                                        <TableHead>Jumlah Refund</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                        <TableBody>
                                            {returnItems.map((item, index) => (
                                                <TableRow key={index} className={item.max_quantity === 0 ? 'opacity-50 bg-gray-50' : ''}>
                                                    <TableCell className="font-medium">
                                                        {item.product_name}
                                                        {item.max_quantity === 0 && (
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                Sudah Diretur Semua
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={item.max_quantity === 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                                                            {item.max_quantity}
                                                        </span>
                                                        {item.max_quantity === 0 && (
                                                            <p className="text-xs text-red-500 mt-1">Tidak tersedia</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={item.max_quantity}
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const inputValue = e.target.value;
                                                                const numValue = parseInt(inputValue) || 0;
                                                                
                                                                // Allow empty input for better UX
                                                                if (inputValue === '') {
                                                                    updateReturnItem(index, 'quantity', 0);
                                                                    return;
                                                                }
                                                                
                                                                updateReturnItem(index, 'quantity', numValue);
                                                            }}
                                                            onBlur={(e) => {
                                                                // Ensure value is within bounds on blur
                                                                const value = parseInt(e.target.value) || 0;
                                                                if (value > item.max_quantity) {
                                                                    updateReturnItem(index, 'quantity', item.max_quantity);
                                                                } else if (value < 0) {
                                                                    updateReturnItem(index, 'quantity', 0);
                                                                }
                                                            }}
                                                            className={`w-20 ${item.max_quantity === 0 ? 'bg-gray-100' : ''}`}
                                                            disabled={item.max_quantity === 0}
                                                            placeholder="0"
                                                        />
                                                        {item.max_quantity > 0 && (
                                                            <p className="text-xs text-gray-500 mt-1">Max: {item.max_quantity}</p>
                                                        )}
                                                        {item.max_quantity === 0 && (
                                                            <p className="text-xs text-red-500 mt-1">Tidak dapat diretur</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>Rp {Number(item.unit_price).toLocaleString('id-ID')}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={item.condition}
                                                            onValueChange={(value) => updateReturnItem(index, 'condition', value)}
                                                            disabled={item.max_quantity === 0}
                                                        >
                                                            <SelectTrigger className={`w-32 ${item.max_quantity === 0 ? 'bg-gray-100' : ''}`}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="good">Baik</SelectItem>
                                                                <SelectItem value="damaged">Rusak</SelectItem>
                                                                <SelectItem value="defective">Cacat</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            placeholder={item.max_quantity === 0 ? "Tidak tersedia" : "Alasan retur..."}
                                                            value={item.reason}
                                                            onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                                                            className={`w-40 ${item.max_quantity === 0 ? 'bg-gray-100' : ''}`}
                                                            disabled={item.max_quantity === 0}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        <span className={item.max_quantity === 0 ? 'text-gray-400' : 'text-green-600'}>
                                                            Rp {(item.quantity * Number(item.unit_price)).toLocaleString('id-ID')}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                            </Table>
                                            
                                            {returnItems.length > 0 && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Barang untuk Diretur: <span className="font-semibold">{getTotalReturnItems()}</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-semibold">Total Jumlah Refund: <span className="text-green-600">Rp {getTotalRefundAmount().toLocaleString('id-ID')}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Form Actions */}
                        {selectedTransaction && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex justify-end space-x-4">
                                        <Link href={route('sales.returns.index')}>
                                            <Button type="button" variant="outline">
                                                Batal
                                            </Button>
                                        </Link>
                                        <AlertDialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    type="submit" 
                                                    disabled={processing || getTotalReturnItems() === 0}
                                                >
                                                    {processing ? 'Membuat...' : 'Buat Permintaan Retur'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Konfirmasi Permintaan Retur</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Anda akan membuat permintaan retur untuk transaksi <strong>{selectedTransaction?.transaction_number}</strong> dengan total {getTotalReturnItems()} barang senilai <strong>Rp {getTotalRefundAmount().toLocaleString('id-ID')}</strong>.
                                                        <br /><br />
                                                        Permintaan retur akan menunggu persetujuan sebelum diproses. Apakah Anda yakin ingin melanjutkan?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={confirmSubmit}
                                                        disabled={processing}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {processing ? 'Membuat...' : 'Ya, Buat Retur'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </form>

                    {/* Return Policy Notice */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Kebijakan Retur:</strong> Barang dapat diretur dalam waktu 30 hari sejak pembelian. 
                            Barang dalam kondisi baik akan di-restock secara otomatis setelah disetujui. 
                            Barang yang rusak atau cacat tidak akan di-restock.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
