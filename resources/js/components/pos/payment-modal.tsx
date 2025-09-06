import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calculator, Receipt, Tag, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import ReceiptModal from './receipt-modal';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
}

interface CartItem {
    product: Product;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
}

interface Customer {
    id: number;
    name: string;
    code: string;
    customer_discount?: {
        id: number;
        name: string;
        discount_percentage: number;
    };
}

interface Discount {
    id: number;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    minimum_amount: number;
    maximum_discount?: number;
    is_active: boolean;
}

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
    is_active: boolean;
}

interface Payment {
    payment_method_id: number;
    amount: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    cart: CartItem[];
    customer: Customer | null;
    paymentMethods: PaymentMethod[];
    discounts: Discount[];
    subtotal: number;
    itemDiscounts: number;
    customerDiscountAmount: number;
    customerDiscountPercentage: number;
    total: number;
    onSuccess: () => void;
}

export default function PaymentModal({
    open,
    onClose,
    cart,
    customer,
    paymentMethods,
    discounts,
    subtotal,
    itemDiscounts,
    customerDiscountAmount,
    customerDiscountPercentage,
    total,
    onSuccess
}: Props) {
    const { props } = usePage();
    const csrfToken = (props as any).csrf_token;
    
    const [payments, setPayments] = useState<Payment[]>([]);
    
    // Initialize payments when component mounts or paymentMethods change
    useEffect(() => {
        if (paymentMethods.length > 0 && payments.length === 0) {
            setPayments([{ payment_method_id: paymentMethods[0].id, amount: 0 }]);
        }
    }, [paymentMethods]);
    const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [lastClickTime, setLastClickTime] = useState<number>(0);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [transactionData, setTransactionData] = useState<any>(null);

    // Debug logs
    console.log('PaymentMethods:', paymentMethods);
    console.log('Discounts received:', discounts);
    console.log('Customer:', customer);
    console.log('Payments state:', payments);

    // Calculate additional discount from selected discount
    const selectedDiscount = selectedDiscountId ? discounts.find(d => d.id === selectedDiscountId) : null;
    let additionalDiscount = 0;
    
    if (selectedDiscount) {
        // Check if subtotal meets minimum purchase requirement
        if (subtotal >= selectedDiscount.minimum_amount) {
            if (selectedDiscount.type === 'percentage') {
                // Calculate percentage discount based on subtotal (before other discounts)
                additionalDiscount = (subtotal * selectedDiscount.value) / 100;
                if (selectedDiscount.maximum_discount && additionalDiscount > selectedDiscount.maximum_discount) {
                    additionalDiscount = selectedDiscount.maximum_discount;
                }
            } else if (selectedDiscount.type === 'fixed') {
                // Fixed amount discount
                additionalDiscount = selectedDiscount.value;
            }
        }
    }

    // Recalculate total with additional discount
    const finalTotal = Math.max(0, total - additionalDiscount);
    
    // Debug discount calculations
    console.log('Discount Calculation Debug:');
    console.log('- Selected Discount ID:', selectedDiscountId);
    console.log('- Selected Discount:', selectedDiscount);
    console.log('- Subtotal:', subtotal);
    console.log('- Additional Discount Calculated:', additionalDiscount);
    console.log('- Original Total:', total);
    console.log('- Final Total after discount:', finalTotal);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const change = Math.max(0, totalPaid - finalTotal);
    const remaining = Math.max(0, finalTotal - totalPaid);

    const addPaymentMethod = () => {
        setPayments([...payments, { payment_method_id: paymentMethods.length > 0 ? paymentMethods[0].id : 0, amount: remaining }]);
    };

    const updatePayment = (index: number, field: keyof Payment, value: any) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], [field]: value };
        setPayments(newPayments);
    };

    const removePayment = (index: number) => {
        if (payments.length > 1) {
            setPayments(payments.filter((_, i) => i !== index));
        }
    };

    const quickAmountButtons = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

    const setQuickAmount = (amount: number) => {
        if (payments.length === 1) {
            // Selalu tambahkan amount ke current amount (akumulasi)
            const currentAmount = payments[0]?.amount || 0;
            updatePayment(0, 'amount', currentAmount + amount);
        }
    };

    // Update payment amount when total changes due to manual discount - only if amount is 0
    useEffect(() => {
        if (payments.length === 1 && payments[0] && payments[0].amount === 0) {
            const newPayments = [...payments];
            newPayments[0] = { ...newPayments[0], amount: finalTotal };
            setPayments(newPayments);
        }
    }, [finalTotal]);

    const processTransaction = async () => {
        // Prevent double click - debounce with 2 seconds
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 2000) {
            toast.error('Mohon tunggu, transaksi sedang diproses...');
            return;
        }
        setLastClickTime(currentTime);

        // Validate payments
        const invalidPayments = payments.filter(p => !p.payment_method_id || p.amount <= 0);
        if (invalidPayments.length > 0) {
            toast.error('Silakan lengkapi semua metode pembayaran');
            return;
        }

        if (totalPaid < finalTotal) {
            toast.error('Jumlah pembayaran kurang dari total');
            return;
        }

        if (!paymentMethods || paymentMethods.length === 0) {
            toast.error('Data metode pembayaran tidak tersedia');
            return;
        }

        setProcessing(true);

        try {
            const response = await fetch(route('pos.cashier.process'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        discount_amount: item.discount_amount,
                        total_amount: item.total_amount
                    })),
                    customer_id: customer?.id || null,
                    payments: payments.map(payment => ({
                        payment_method_id: payment.payment_method_id,
                        amount: payment.amount
                    })),
                    subtotal_amount: subtotal,
                    discount_amount: itemDiscounts,
                    customer_discount_amount: customerDiscountAmount,
                    customer_discount_percentage: customerDiscountPercentage,
                    total_discount: itemDiscounts + customerDiscountAmount + additionalDiscount,
                    additional_discount_amount: additionalDiscount,
                    discount_id: selectedDiscountId,
                    tax_amount: 0,
                    total_amount: finalTotal,
                    paid_amount: totalPaid,
                    change_amount: change
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Transaksi berhasil diproses!');
                
                // Prepare transaction data for receipt
                const receiptData = {
                    id: data.transaction?.id || '',
                    transaction_number: data.transaction?.transaction_number || '',
                    date: data.transaction?.created_at || new Date().toISOString(),
                    items: cart,
                    customer: customer,
                    payments: payments.map(payment => ({
                        payment_method: paymentMethods.find(pm => pm.id === payment.payment_method_id) || { id: 0, name: 'Unknown', type: 'unknown' },
                        amount: payment.amount
                    })),
                    subtotal: subtotal,
                    item_discounts: itemDiscounts,
                    customer_discount_amount: customerDiscountAmount,
                    customer_discount_percentage: customerDiscountPercentage,
                    additional_discount: additionalDiscount,
                    total_amount: finalTotal,
                    paid_amount: totalPaid,
                    change_amount: change,
                    cashier_name: data.transaction?.cashier_name || 'Kasir',
                    store_name: data.transaction?.store_name || 'Toko',
                    store_address: data.transaction?.store_address || '',
                    store_phone: data.transaction?.store_phone || ''
                };
                
                setTransactionData(receiptData);
                setShowReceiptModal(true);
                
                // Reset click time after successful transaction
                setLastClickTime(0);
            } else {
                toast.error(data.message || 'Terjadi kesalahan saat memproses transaksi');
            }
        } catch (error) {
            console.error('Error processing transaction:', error);
            toast.error('Terjadi kesalahan saat memproses transaksi');
        } finally {
            setProcessing(false);
        }
    };

    const handleReceiptClose = () => {
        setShowReceiptModal(false);
        setTransactionData(null);
        onSuccess();
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div 
                className="bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
                style={{ 
                    width: '95vw', 
                    height: '95vh',
                    maxWidth: 'none',
                    maxHeight: 'none'
                }}
            >
                {/* Content - 3 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 overflow-y-auto flex-1">
                    {/* Left Column - Transaction Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                                <Receipt className="h-6 w-6" />
                                Ringkasan Transaksi
                            </h3>
                            
                            {/* Customer Info */}
                            {customer && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="font-medium text-gray-900 text-lg">{customer.name}</div>
                                    <div className="text-base text-gray-600">{customer.code}</div>
                                    {customer.customer_discount && (
                                        <Badge 
                                            variant="secondary" 
                                            className="mt-2 text-sm bg-blue-100 text-blue-700"
                                        >
                                            Member: {customer.customer_discount.name}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Items Summary */}
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex justify-between text-base">
                                        <div>
                                            <div className="text-gray-900 font-medium">{item.product.name}</div>
                                            <div className="text-gray-500">
                                                {item.quantity} x Rp {(item.unit_price || 0).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-gray-900">
                                            Rp {(item.total_amount || 0).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="text-gray-900 font-medium">Rp {(subtotal || 0).toLocaleString('id-ID')}</span>
                                </div>
                                
                                {itemDiscounts > 0 && (
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Diskon Item:</span>
                                        <span className="text-red-600 font-medium">-Rp {(itemDiscounts || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                {customerDiscountAmount > 0 && (
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">
                                            Diskon Member ({customerDiscountPercentage}%):
                                        </span>
                                        <span className="text-red-600 font-medium">
                                            -Rp {(customerDiscountAmount || 0).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {/* Additional discount from selected discount */}
                                {additionalDiscount > 0 && (
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Diskon Tambahan:</span>
                                        <span className="text-red-600 font-medium">-Rp {(additionalDiscount || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-gray-900">Rp {(finalTotal || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Discounts */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                                <Tag className="h-6 w-6" />
                                Diskon Tersedia
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <Label className="text-base font-medium text-gray-900 mb-3 block">
                                        Pilih Diskon
                                    </Label>
                                    <Select
                                        value={selectedDiscountId?.toString() || "no-discount"}
                                        onValueChange={(value) => setSelectedDiscountId(value === "no-discount" ? null : parseInt(value))}
                                    >
                                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-12 text-base">
                                            <SelectValue placeholder="Pilih diskon (opsional)" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 z-[100]">
                                            <SelectItem value="no-discount" className="text-gray-900 hover:bg-gray-50">
                                                Tidak ada diskon
                                            </SelectItem>
                                            {discounts?.filter(d => d.is_active && (subtotal || 0) >= (d.minimum_amount || 0)).map((discount) => (
                                                <SelectItem 
                                                    key={discount.id} 
                                                    value={discount.id.toString()}
                                                    className="text-gray-900 hover:bg-gray-50"
                                                >
                                                    {discount.name} - {discount.type === 'percentage' ? `${discount.value}%` : `Rp ${(discount.value || 0).toLocaleString('id-ID')}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Selected Discount Info */}
                                {selectedDiscount && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="text-sm text-green-800">
                                            <div className="font-medium">{selectedDiscount.name}</div>
                                            <div>
                                                {selectedDiscount.type === 'percentage' 
                                                    ? `Diskon ${selectedDiscount.value}%` 
                                                    : `Diskon Rp ${(selectedDiscount.value || 0).toLocaleString('id-ID')}`
                                                }
                                            </div>
                                            <div>Min. pembelian: Rp {(selectedDiscount.minimum_amount || 0).toLocaleString('id-ID')}</div>
                                            {selectedDiscount.maximum_discount && (
                                                <div>Max. diskon: Rp {(selectedDiscount.maximum_discount || 0).toLocaleString('id-ID')}</div>
                                            )}
                                            <div className="font-medium mt-1">
                                                Diskon yang didapat: Rp {(additionalDiscount || 0).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Available Discounts List */}
                                <div>
                                    <Label className="text-sm font-medium text-gray-900 mb-2 block">
                                        Diskon Tersedia
                                    </Label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {discounts?.filter(d => d.is_active).map((discount) => (
                                            <div 
                                                key={discount.id} 
                                                className={`p-2 rounded text-xs border ${
                                                    (subtotal || 0) >= (discount.minimum_amount || 0)
                                                        ? 'bg-green-50 border-green-200 text-green-800' 
                                                        : 'bg-gray-100 border-gray-200 text-gray-500'
                                                }`}
                                            >
                                                <div className="font-medium">{discount.name}</div>
                                                <div>
                                                    {discount.type === 'percentage' 
                                                        ? `${discount.value}%` 
                                                        : `Rp ${(discount.value || 0).toLocaleString('id-ID')}`
                                                    }
                                                </div>
                                                <div>Min: Rp {(discount.minimum_amount || 0).toLocaleString('id-ID')}</div>
                                                {(subtotal || 0) < (discount.minimum_amount || 0) && (
                                                    <div className="text-red-600 text-xs">
                                                        Kurang Rp {((discount.minimum_amount || 0) - (subtotal || 0)).toLocaleString('id-ID')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* Debug info */}
                                        {(!discounts || discounts.length === 0) && (
                                            <div className="p-2 text-xs text-gray-500 text-center">
                                                Tidak ada data diskon tersedia
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment Methods */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                                <Calculator className="h-6 w-6" />
                                Metode Pembayaran
                            </h3>

                            <div className="space-y-4">
                                {payments.map((payment, index) => (
                                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium text-gray-900">
                                                Pembayaran {index + 1}
                                            </Label>
                                            {payments.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removePayment(index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Select
                                                value={payment.payment_method_id > 0 ? payment.payment_method_id.toString() : ""}
                                                onValueChange={(value) => 
                                                    updatePayment(index, 'payment_method_id', parseInt(value))
                                                }
                                            >
                                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                                    <SelectValue placeholder="Pilih metode" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200 z-[100]">
                                                    {paymentMethods?.length > 0 ? (
                                                        paymentMethods.map((method) => (
                                                            <SelectItem 
                                                                key={method.id} 
                                                                value={method.id.toString()}
                                                                className="text-gray-900 hover:bg-gray-50"
                                                            >
                                                                {method.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-methods" disabled className="text-gray-500">
                                                            Tidak ada metode pembayaran tersedia
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            <Input
                                                type="number"
                                                placeholder="Jumlah"
                                                value={payment.amount > 0 ? payment.amount.toString() : ''}
                                                onChange={(e) => 
                                                    updatePayment(index, 'amount', parseFloat(e.target.value) || 0)
                                                }
                                                className="bg-white border-gray-300 text-gray-900"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Add Payment Method Button */}
                                <Button
                                    variant="outline"
                                    onClick={addPaymentMethod}
                                    className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Metode
                                </Button>

                                {/* Quick Amount Buttons */}
                                {payments.length === 1 && (
                                    <div className="mt-4">
                                        <Label className="text-sm font-medium text-gray-900 mb-2 block">
                                            Jumlah Cepat
                                        </Label>
                                        <div className="text-xs text-gray-500 mb-2">
                                            Setiap klik akan menambah amount secara otomatis
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {quickAmountButtons.slice(0, 6).map((amount) => (
                                                <Button
                                                    key={amount}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setQuickAmount(amount)}
                                                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                                >
                                                    +{amount >= 1000 ? `${amount/1000}k` : amount}
                                                </Button>
                                            ))}
                                        </div>
                                        
                                        {/* Control Buttons */}
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updatePayment(0, 'amount', 0)}
                                                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                            >
                                                Reset 0
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updatePayment(0, 'amount', finalTotal)}
                                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                            >
                                                Set Total
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuickAmount(100000)}
                                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                            >
                                                +100K
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Summary */}
                                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total yang harus dibayar:</span>
                                            <span className="font-medium text-gray-900">
                                                Rp {(finalTotal || 0).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total dibayar:</span>
                                            <span className="font-medium text-gray-900">
                                                Rp {(totalPaid || 0).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        
                                        {remaining > 0 ? (
                                            <div className="flex justify-between text-red-600">
                                                <span>Kurang:</span>
                                                <span className="font-medium">
                                                    Rp {(remaining || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-green-600">
                                                <span>Kembalian:</span>
                                                <span className="font-medium">
                                                    Rp {(change || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-6 px-8 pb-6 shrink-0 bg-gray-50">
                    <div className="flex justify-end gap-4">
                        <Button 
                            variant="outline" 
                            onClick={onClose}
                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={processTransaction}
                            disabled={processing || totalPaid < finalTotal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Memproses...' : 'Proses Pembayaran'}
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Receipt Modal */}
            <ReceiptModal
                open={showReceiptModal}
                onClose={handleReceiptClose}
                transactionData={transactionData}
            />
        </div>
    );
}