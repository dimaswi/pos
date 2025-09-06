import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Minus, Search, ShoppingCart, Trash2, Calculator, Save, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import ProductSelectionModal from '@/components/ProductSelectionModal';
import { toast } from 'sonner';
import { BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';

interface StoreData {
    id: number;
    name: string;
}

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
    minimum_purchase: number;
    maximum_discount: number | null;
}

interface CustomerData {
    id: number;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    customer_discount_id: number | null;
    customer_discount?: CustomerDiscount;
    total_points: number;
    total_spent: number;
    total_transactions: number;
}

interface ProductData {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    selling_price: number;
    stock_quantity: number;
    unit: string;
    category_name: string;
}

interface DiscountData {
    id: number;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    minimum_amount: number | null;
    maximum_discount: number | null;
}

interface PaymentMethodData {
    id: number;
    name: string;
    type: string;
    fee_percentage: number;
    fee_fixed: number;
    is_active: boolean;
}

interface TransactionItem {
    product_id: number;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
    max_stock: number;
}

interface TransactionPayment {
    payment_method_id: number;
    payment_method_name: string;
    amount: number;
    fee_amount: number;
}

interface Props {
    stores: StoreData[];
    customers: CustomerData[];
    products: ProductData[];
    discounts: DiscountData[];
    paymentMethods: PaymentMethodData[];
    auth: any;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Penjualan', href: '/sales' },
    { title: 'Transaksi', href: '/sales/transactions' },
    { title: 'Buat Transaksi', href: '/sales/transactions/create' },
];

export default function SalesTransactionCreate() {
    const { stores, customers, products, discounts, paymentMethods, auth } = usePage<Props>().props;
    
    // Form state
    const [storeId, setStoreId] = useState<string>('');
    const [customerId, setCustomerId] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [payments, setPayments] = useState<TransactionPayment[]>([]);
    const [appliedDiscountId, setAppliedDiscountId] = useState<string>('');
    
    // UI state
    const [showProductDialog, setShowProductDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    
    // Calculations
    const [calculations, setCalculations] = useState({
        subtotal: 0,
        discountAmount: 0,
        customerDiscountAmount: 0,
        customerDiscountPercentage: 0,
        taxAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        changeAmount: 0,
        totalFees: 0,
    });

    // Options for searchable selects
    const storeOptions = (stores || []).map(store => ({
        value: store.id.toString(),
        label: store.name
    }));

    const customerOptions = [
        { value: '', label: 'Pelanggan Umum' },
        ...(customers || []).map(customer => ({
            value: customer.id.toString(),
            label: customer.customer_discount 
                ? `${customer.name} (${customer.customer_discount.name} - ${customer.customer_discount.discount_percentage}%)`
                : `${customer.name} (Tanpa Member)`
        }))
    ];

    const discountOptions = [
        { value: '', label: 'Tanpa Diskon' },
        ...(discounts || []).map(discount => ({
            value: discount.id.toString(),
            label: `${discount.name} (${discount.type === 'percentage' ? discount.value + '%' : formatCurrency(discount.value)})`
        }))
    ];

    const formatCurrency = (amount: number) => {
        if (isNaN(amount) || amount === null || amount === undefined) {
            amount = 0;
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate totals
    useEffect(() => {
        const subtotal = items.reduce((sum, item) => {
            const price = isNaN(item.total_price) ? 0 : item.total_price;
            return sum + price;
        }, 0);
        
        let discountAmount = 0;
        if (appliedDiscountId) {
            const discount = (discounts || []).find(d => d.id.toString() === appliedDiscountId);
            if (discount) {
                if (discount.minimum_amount && subtotal < discount.minimum_amount) {
                    // Discount not applicable
                } else {
                    if (discount.type === 'percentage') {
                        discountAmount = subtotal * (discount.value / 100);
                    } else {
                        discountAmount = discount.value;
                    }
                    
                    if (discount.maximum_discount && discountAmount > discount.maximum_discount) {
                        discountAmount = discount.maximum_discount;
                    }
                }
            }
        }

        // Calculate customer discount
        let customerDiscountAmount = 0;
        let customerDiscountPercentage = 0;
        if (customerId) {
            const customer = (customers || []).find(c => c.id.toString() === customerId);
            if (customer && customer.customer_discount) {
                customerDiscountPercentage = customer.customer_discount.discount_percentage;
                customerDiscountAmount = subtotal * (customerDiscountPercentage / 100);
                
                // Apply minimum purchase check
                if (customer.customer_discount.minimum_purchase > 0 && subtotal < customer.customer_discount.minimum_purchase) {
                    customerDiscountAmount = 0;
                    customerDiscountPercentage = 0;
                }
                
                // Apply maximum discount limit
                if (customer.customer_discount.maximum_discount && customerDiscountAmount > customer.customer_discount.maximum_discount) {
                    customerDiscountAmount = customer.customer_discount.maximum_discount;
                }
            }
        }
        
        const taxAmount = 0; // Assuming no tax for now
        const totalAmount = subtotal - discountAmount - customerDiscountAmount + taxAmount;
        const paidAmount = payments.reduce((sum, payment) => {
            const amount = isNaN(payment.amount) ? 0 : payment.amount;
            return sum + amount;
        }, 0);
        const totalFees = payments.reduce((sum, payment) => {
            const fee = isNaN(payment.fee_amount) ? 0 : payment.fee_amount;
            return sum + fee;
        }, 0);
        const changeAmount = Math.max(0, paidAmount - totalAmount);
        
        setCalculations({
            subtotal,
            discountAmount,
            customerDiscountAmount,
            customerDiscountPercentage,
            taxAmount,
            totalAmount,
            paidAmount,
            changeAmount,
            totalFees,
        });
    }, [items, appliedDiscountId, customerId, payments, discounts, customers]);

    const addProduct = (product: ProductData) => {
        const existingItem = items.find(item => item.product_id === product.id);
        
        if (existingItem) {
            const currentQuantity = Number(existingItem.quantity) || 0;
            updateItemQuantity(product.id, currentQuantity + 1);
        } else {
            const newItem: TransactionItem = {
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                quantity: 1,
                unit_price: Number(product.selling_price) || 0,
                discount_amount: 0,
                total_price: Number(product.selling_price) || 0,
                max_stock: Number(product.stock_quantity) || 0,
            };
            setItems([...items, newItem]);
        }
        setShowProductDialog(false);
    };

    const updateItemQuantity = (productId: number, newQuantity: number) => {
        // Pastikan newQuantity adalah number yang valid
        const validQuantity = Number(newQuantity) || 0;
        
        if (validQuantity <= 0) {
            removeItem(productId);
            return;
        }
        
        setItems(items.map(item => {
            if (item.product_id === productId) {
                const maxStock = Number(item.max_stock) || 0;
                const quantity = Math.min(validQuantity, maxStock);
                const unitPrice = Number(item.unit_price) || 0;
                const discountAmount = Number(item.discount_amount) || 0;
                const totalPrice = (unitPrice - discountAmount) * quantity;
                return {
                    ...item,
                    quantity,
                    total_price: isNaN(totalPrice) ? 0 : totalPrice,
                };
            }
            return item;
        }));
    };

    const updateItemDiscount = (productId: number, discountAmount: number) => {
        const validDiscount = Number(discountAmount) || 0;
        
        setItems(items.map(item => {
            if (item.product_id === productId) {
                const unitPrice = Number(item.unit_price) || 0;
                const quantity = Number(item.quantity) || 1;
                const maxDiscount = unitPrice * 0.9; // Max 90% discount
                const finalDiscount = Math.min(validDiscount, maxDiscount);
                const totalPrice = (unitPrice - finalDiscount) * quantity;
                return {
                    ...item,
                    discount_amount: finalDiscount,
                    total_price: isNaN(totalPrice) ? 0 : totalPrice,
                };
            }
            return item;
        }));
    };

    const removeItem = (productId: number) => {
        setItems(items.filter(item => item.product_id !== productId));
    };

    const addPayment = (paymentMethodId: number, amount: number) => {
        const paymentMethod = (paymentMethods || []).find(pm => pm.id === paymentMethodId);
        if (!paymentMethod) return;

        let feeAmount = 0;
        if (paymentMethod.fee_percentage > 0) {
            feeAmount += amount * (paymentMethod.fee_percentage / 100);
        }
        if (paymentMethod.fee_fixed > 0) {
            feeAmount += paymentMethod.fee_fixed;
        }

        const newPayment: TransactionPayment = {
            payment_method_id: paymentMethodId,
            payment_method_name: paymentMethod.name,
            amount,
            fee_amount: feeAmount,
        };

        setPayments([...payments, newPayment]);
        setShowPaymentDialog(false);
    };

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        // Validation
        if (!storeId) {
            toast.error('Mohon pilih toko');
            return;
        }
        
        if (items.length === 0) {
            toast.error('Mohon tambahkan minimal satu produk');
            return;
        }
        
        if (calculations.paidAmount < calculations.totalAmount) {
            toast.error('Jumlah pembayaran tidak mencukupi');
            return;
        }

        const data = {
            store_id: parseInt(storeId),
            customer_id: customerId ? parseInt(customerId) : null,
            reference_number: referenceNumber || null,
            notes: notes || null,
            discount_id: appliedDiscountId ? parseInt(appliedDiscountId) : null,
            items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: item.discount_amount,
            })),
            payments: payments.map(payment => ({
                payment_method_id: payment.payment_method_id,
                amount: payment.amount,
            })),
        };

        router.post('/sales/transactions', data, {
            onSuccess: () => {
                toast.success('Transaksi berhasil dibuat');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                
                // Check for specific error messages
                if (errors.message && errors.message.includes('duplicate key')) {
                    toast.error('Terjadi kesalahan pada nomor transaksi. Silakan coba lagi.');
                } else if (errors.message) {
                    toast.error('Terjadi kesalahan: ' + errors.message);
                } else {
                    toast.error('Mohon periksa kembali form');
                }
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transaksi Penjualan" />

            <ProductSelectionModal
                products={products}
                isOpen={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                onSelectProduct={addProduct}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Transaction Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Detail Transaksi
                            </CardTitle>
                            <CardDescription>
                                Masukkan informasi dasar transaksi
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="store">Toko *</Label>
                                    <SearchableSelect
                                        value={storeId}
                                        onValueChange={setStoreId}
                                        options={storeOptions}
                                        placeholder="Pilih toko"
                                        emptyText="Toko tidak ditemukan"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="customer">Pelanggan</Label>
                                    <SearchableSelect
                                        value={customerId}
                                        onValueChange={setCustomerId}
                                        options={customerOptions}
                                        placeholder="Pilih pelanggan"
                                        emptyText="Pelanggan tidak ditemukan"
                                    />
                                    {customerId && (() => {
                                        const customer = (customers || []).find(c => c.id.toString() === customerId);
                                        return customer && customer.customer_discount ? (
                                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                                <div className="text-sm text-green-800">
                                                    <span className="font-medium">{customer.customer_discount.name}</span>
                                                    <span className="ml-2">({customer.customer_discount.discount_percentage}% diskon)</span>
                                                </div>
                                                {customer.customer_discount.minimum_purchase > 0 && (
                                                    <div className="text-xs text-green-600 mt-1">
                                                        Min. pembelian: {formatCurrency(customer.customer_discount.minimum_purchase)}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                                
                                <div>
                                    <Label htmlFor="reference">Nomor Referensi</Label>
                                    <Input
                                        id="reference"
                                        type="text"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        placeholder="Nomor referensi opsional"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="discount">Diskon Transaksi</Label>
                                    <SearchableSelect
                                        value={appliedDiscountId}
                                        onValueChange={setAppliedDiscountId}
                                        options={discountOptions}
                                        placeholder="Pilih diskon"
                                        emptyText="Diskon tidak ditemukan"
                                    />
                                    {appliedDiscountId && (
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                            {(() => {
                                                const selectedDiscount = (discounts || []).find(d => d.id.toString() === appliedDiscountId);
                                                if (!selectedDiscount) return null;
                                                
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="font-medium">{selectedDiscount.name}</div>
                                                        <div className="text-muted-foreground">
                                                            Nilai: {selectedDiscount.type === 'percentage' 
                                                                ? `${selectedDiscount.value}%` 
                                                                : formatCurrency(selectedDiscount.value)
                                                            }
                                                        </div>
                                                        {selectedDiscount.minimum_amount && (
                                                            <div className="text-muted-foreground">
                                                                Minimum pembelian: {formatCurrency(selectedDiscount.minimum_amount)}
                                                            </div>
                                                        )}
                                                        {selectedDiscount.maximum_discount && (
                                                            <div className="text-muted-foreground">
                                                                Maksimal diskon: {formatCurrency(selectedDiscount.maximum_discount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Catatan transaksi opsional"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Item Transaksi</CardTitle>
                                    <CardDescription>Tambahkan produk ke transaksi</CardDescription>
                                </div>
                                <Button 
                                    onClick={() => setShowProductDialog(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Produk
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Harga</TableHead>
                                                <TableHead>Jumlah</TableHead>
                                                <TableHead>Diskon</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead className="w-20">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.product_name}</div>
                                                            <div className="text-sm text-muted-foreground">SKU: {item.product_sku}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {formatCurrency(item.unit_price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    const currentQuantity = Number(item.quantity) || 0;
                                                                    const newQuantity = currentQuantity - 1;
                                                                    if (newQuantity >= 1) {
                                                                        updateItemQuantity(item.product_id, newQuantity);
                                                                    }
                                                                }}
                                                                disabled={Number(item.quantity) <= 1}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                value={String(Number(item.quantity) || 1)}
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value);
                                                                    if (!isNaN(value) && value >= 1) {
                                                                        updateItemQuantity(item.product_id, value);
                                                                    }
                                                                }}
                                                                className="w-16 text-center"
                                                                min="1"
                                                                max={Number(item.max_stock) || 1}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    const currentQuantity = Number(item.quantity) || 0;
                                                                    const maxStock = Number(item.max_stock) || 0;
                                                                    const newQuantity = currentQuantity + 1;
                                                                    if (newQuantity <= maxStock) {
                                                                        updateItemQuantity(item.product_id, newQuantity);
                                                                    }
                                                                }}
                                                                disabled={Number(item.quantity) >= Number(item.max_stock)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Stok: {Number(item.max_stock) || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={String(Number(item.discount_amount) || 0)}
                                                            onChange={(e) => {
                                                                const value = parseFloat(e.target.value);
                                                                if (!isNaN(value) && value >= 0) {
                                                                    updateItemDiscount(item.product_id, value);
                                                                }
                                                            }}
                                                            className="w-24"
                                                            min="0"
                                                            max={Number(item.unit_price) * 0.9 || 0}
                                                            step="1000"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-mono font-medium">
                                                        {formatCurrency(item.total_price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => removeItem(item.product_id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Belum ada item. Klik "Tambah Produk" untuk mulai menambahkan item ke transaksi.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary and Payment */}
                <div className="space-y-6">
                    {/* Transaction Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Ringkasan Transaksi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-mono">{formatCurrency(calculations.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Diskon:</span>
                                <div className="text-right">
                                    <span className="font-mono">-{formatCurrency(calculations.discountAmount)}</span>
                                    {appliedDiscountId && calculations.discountAmount === 0 && (
                                        <div className="text-xs text-orange-600 mt-1">
                                            Syarat minimum belum terpenuhi
                                        </div>
                                    )}
                                </div>
                            </div>
                            {calculations.customerDiscountAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>Diskon Member:</span>
                                    <div className="text-right">
                                        <span className="font-mono">-{formatCurrency(calculations.customerDiscountAmount)}</span>
                                        <div className="text-xs text-green-600 mt-1">
                                            {calculations.customerDiscountPercentage}% member discount
                                        </div>
                                    </div>
                                </div>
                            )}
                            {customerId && calculations.customerDiscountAmount === 0 && (() => {
                                const customer = (customers || []).find(c => c.id.toString() === customerId);
                                return customer && customer.customer_discount && customer.customer_discount.minimum_purchase > calculations.subtotal ? (
                                    <div className="flex justify-between">
                                        <span>Diskon Member:</span>
                                        <div className="text-right">
                                            <span className="font-mono">-{formatCurrency(0)}</span>
                                            <div className="text-xs text-orange-600 mt-1">
                                                Min. belanja {formatCurrency(customer.customer_discount.minimum_purchase)}
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                            <div className="flex justify-between">
                                <span>Pajak:</span>
                                <span className="font-mono">{formatCurrency(calculations.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Biaya Pembayaran:</span>
                                <span className="font-mono">{formatCurrency(calculations.totalFees)}</span>
                            </div>
                            <hr />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total:</span>
                                <span className="font-mono">{formatCurrency(calculations.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Dibayar:</span>
                                <span className="font-mono">{formatCurrency(calculations.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali:</span>
                                <span className="font-mono font-semibold text-green-600">
                                    {formatCurrency(calculations.changeAmount)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Metode Pembayaran</CardTitle>
                                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Tambah Pembayaran
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Tambah Pembayaran</DialogTitle>
                                            <DialogDescription>
                                                Pilih metode pembayaran dan masukkan jumlah
                                            </DialogDescription>
                                        </DialogHeader>
                                        <PaymentForm
                                            paymentMethods={paymentMethods}
                                            remainingAmount={calculations.totalAmount - calculations.paidAmount}
                                            onAddPayment={addPayment}
                                            onCancel={() => setShowPaymentDialog(false)}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {payments.length > 0 ? (
                                <div className="space-y-2">
                                    {payments.map((payment, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                                            <div>
                                                <div className="font-medium">{payment.payment_method_name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatCurrency(payment.amount)}
                                                    {payment.fee_amount > 0 && (
                                                        <span className="text-red-600"> (Biaya: {formatCurrency(payment.fee_amount)})</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => removePayment(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                    Belum ada pembayaran
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full flex items-center gap-2"
                                    disabled={items.length === 0 || calculations.paidAmount < calculations.totalAmount}
                                >
                                    <Save className="h-4 w-4" />
                                    Selesaikan Transaksi
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.visit('/sales/transactions')}
                                    className="w-full"
                                >
                                    Batal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

// Payment Form Component
interface PaymentFormProps {
    paymentMethods: PaymentMethodData[];
    remainingAmount: number;
    onAddPayment: (paymentMethodId: number, amount: number) => void;
    onCancel: () => void;
}

function PaymentForm({ paymentMethods, remainingAmount, onAddPayment, onCancel }: PaymentFormProps) {
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [amount, setAmount] = useState<number>(remainingAmount);

    const paymentOptions = (paymentMethods || [])
        .filter(pm => pm.is_active)
        .map(pm => ({
            value: pm.id.toString(),
            label: `${pm.name} (${pm.type})`
        }));

    const selectedMethod = (paymentMethods || []).find(pm => pm.id.toString() === selectedMethodId);
    
    const calculateFee = () => {
        if (!selectedMethod) return 0;
        
        let fee = 0;
        if (selectedMethod.fee_percentage > 0) {
            fee += amount * (selectedMethod.fee_percentage / 100);
        }
        if (selectedMethod.fee_fixed > 0) {
            fee += selectedMethod.fee_fixed;
        }
        return fee;
    };

    const handleSubmit = () => {
        if (!selectedMethodId || !amount || amount <= 0) {
            toast.error('Mohon pilih metode pembayaran dan masukkan jumlah yang valid');
            return;
        }

        onAddPayment(parseInt(selectedMethodId), amount);
        setSelectedMethodId('');
        setAmount(0);
    };

    const formatCurrency = (amount: number) => {
        if (isNaN(amount) || amount === null || amount === undefined) {
            amount = 0;
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Metode Pembayaran</Label>
                <SearchableSelect
                    value={selectedMethodId}
                    onValueChange={setSelectedMethodId}
                    options={paymentOptions}
                    placeholder="Pilih metode pembayaran"
                    emptyText="Metode pembayaran tidak ditemukan"
                />
            </div>
            
            <div>
                <Label>Jumlah</Label>
                <Input
                    type="number"
                    value={String(amount || 0)}
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                            setAmount(value);
                        } else if (e.target.value === '') {
                            setAmount(0);
                        }
                    }}
                    placeholder="Masukkan jumlah"
                    min="1"
                />
                <div className="text-sm text-muted-foreground mt-1">
                    Sisa: {formatCurrency(remainingAmount)}
                </div>
            </div>
            
            {selectedMethod && (selectedMethod.fee_percentage > 0 || selectedMethod.fee_fixed > 0) && (
                <div className="p-3 bg-yellow-50 rounded border">
                    <div className="text-sm font-medium">Biaya Pembayaran</div>
                    <div className="text-sm text-muted-foreground">
                        {selectedMethod.fee_percentage > 0 && selectedMethod.fee_fixed > 0 
                            ? `${selectedMethod.fee_percentage}% + ${formatCurrency(selectedMethod.fee_fixed)} = ${formatCurrency(calculateFee())}`
                            : selectedMethod.fee_percentage > 0
                            ? `${selectedMethod.fee_percentage}% = ${formatCurrency(calculateFee())}`
                            : formatCurrency(selectedMethod.fee_fixed)
                        }
                    </div>
                </div>
            )}
            
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>
                    Batal
                </Button>
                <Button onClick={handleSubmit}>
                    Tambah Pembayaran
                </Button>
            </DialogFooter>
        </div>
    );
}
