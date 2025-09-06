import React from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/app-layout';

interface Store {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
}

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
    minimum_purchase: number;
    maximum_discount: number | null;
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    customer_discount_id: number | null;
    customer_discount?: CustomerDiscount;
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
    total_amount: number;
}

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
}

interface SalesPayment {
    id: number;
    payment_method: PaymentMethod;
    amount: number;
    reference_number?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface SalesTransaction {
    id: number;
    transaction_number: string;
    store: Store;
    customer?: Customer;
    user?: User;
    transaction_date: string;
    notes?: string;
    subtotal_amount: number;
    discount_amount: number;
    customer_discount_amount: number;
    customer_discount_percentage: number;
    additional_discount_amount: number;
    discount_id: number | null;
    tax_amount: number;
    total_amount: number;
    status: string;
    sales_items: SalesItem[];
    payments: SalesPayment[];
    created_at: string;
}

interface Props {
    transaction: SalesTransaction;
}

export default function Receipt({ transaction }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // This would trigger a PDF download
        window.location.href = route('sales.transactions.receipt.pdf', transaction.id);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Penjualan', href: '#' },
                { title: 'Transaksi', href: route('sales.transactions.index') },
                { title: transaction.transaction_number, href: route('sales.transactions.show', transaction.id) },
                { title: 'Struk', href: route('sales.transactions.receipt', transaction.id) }
            ]}
        >
            <Head title={`Struk - ${transaction.transaction_number}`} />

            <div className="py-6">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    {/* Action Buttons */}
                    <div className="flex justify-between items-center mb-6 print-hidden">
                        <Button 
                            variant="outline" 
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={handleDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Unduh PDF
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak
                            </Button>
                        </div>
                    </div>

                    {/* Receipt */}
                    <div className="print-only">
                        <Card className="print-shadow-none print-border-none">
                            <CardHeader className="text-center border-b">
                            {/* Store Logo */}
                            {transaction.store.logo && (
                                <div className="flex justify-center mb-4">
                                    <img 
                                        src={transaction.store.logo} 
                                        alt={transaction.store.name}
                                        className="h-16 w-auto"
                                    />
                                </div>
                            )}
                            
                            {/* Store Information */}
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">{transaction.store.name}</h1>
                                {transaction.store.address && (
                                    <p className="text-sm text-gray-600">{transaction.store.address}</p>
                                )}
                                <div className="flex justify-center space-x-4 text-sm text-gray-600">
                                    {transaction.store.phone && (
                                        <span>Tel: {transaction.store.phone}</span>
                                    )}
                                    {transaction.store.email && (
                                        <span>Email: {transaction.store.email}</span>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            {/* Transaction Header */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold mb-2">STRUK PENJUALAN</h2>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>No. Struk:</span>
                                        <span className="font-mono">{transaction.transaction_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tanggal:</span>
                                        <span>{new Date(transaction.transaction_date).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kasir:</span>
                                        <span>{transaction.user?.name || 'Unknown'}</span>
                                    </div>
                                    {transaction.customer && (
                                        <>
                                            <div className="flex justify-between">
                                                <span>Pelanggan:</span>
                                                <span>{transaction.customer.name}</span>
                                            </div>
                                            {transaction.customer.customer_discount && (
                                                <div className="flex justify-between text-sm">
                                                    <span>Member:</span>
                                                    <span>{transaction.customer.customer_discount.name}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {/* Items */}
                            <div className="space-y-2 mb-6">
                                {transaction.sales_items.map((item, index) => (
                                    <div key={item.id} className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="text-sm text-gray-600">SKU: {item.product.sku}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                                            <span className="font-medium">{formatCurrency(item.total_amount)}</span>
                                        </div>
                                        {item.discount_amount > 0 && (
                                            <div className="flex justify-between text-sm text-red-600">
                                                <span>Diskon Item</span>
                                                <span>-{formatCurrency(item.discount_amount)}</span>
                                            </div>
                                        )}
                                        {index < transaction.sales_items.length - 1 && (
                                            <hr className="border-dotted my-2" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Totals */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(transaction.subtotal_amount)}</span>
                                </div>
                                {transaction.discount_amount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Diskon Item:</span>
                                        <span>-{formatCurrency(transaction.discount_amount)}</span>
                                    </div>
                                )}
                                {transaction.customer_discount_amount > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>Diskon Member ({transaction.customer_discount_percentage}%):</span>
                                        <span>-{formatCurrency(transaction.customer_discount_amount)}</span>
                                    </div>
                                )}
                                {transaction.additional_discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Diskon Tambahan:</span>
                                        <span>-{formatCurrency(transaction.additional_discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Pajak:</span>
                                    <span>{formatCurrency(transaction.tax_amount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(transaction.total_amount)}</span>
                                </div>
                            </div>

                            {/* Payments */}
                            {transaction.payments.length > 0 && (
                                <>
                                    <Separator className="my-4" />
                                    <div className="mb-6">
                                        <h3 className="font-semibold mb-2">Detail Pembayaran</h3>
                                        <div className="space-y-1">
                                            {transaction.payments.map((payment) => (
                                                <div key={payment.id} className="flex justify-between text-sm">
                                                    <span>{payment.payment_method.name}</span>
                                                    <span>{formatCurrency(payment.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Notes */}
                            {transaction.notes && (
                                <>
                                    <Separator className="my-4" />
                                    <div className="mb-6">
                                        <h3 className="font-semibold mb-2">Catatan</h3>
                                        <p className="text-sm text-gray-700">{transaction.notes}</p>
                                    </div>
                                </>
                            )}

                            {/* Footer */}
                            <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-dotted">
                                <p>Terima kasih atas kunjungan Anda!</p>
                                <p className="mt-2">Untuk pengembalian dan penukaran, harap tunjukkan struk ini.</p>
                                <p className="mt-2 text-xs">
                                    Dibuat pada {new Date().toLocaleString('id-ID')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    /* Hide everything except the receipt */
                    body * {
                        visibility: hidden;
                    }
                    
                    .print-only, .print-only * {
                        visibility: visible;
                    }
                    
                    .print-only {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 100% !important;
                    }
                    
                    .print-hidden {
                        display: none !important;
                    }
                    
                    .print-shadow-none {
                        box-shadow: none !important;
                    }
                    
                    .print-border-none {
                        border: none !important;
                    }
                    
                    @page {
                        margin: 0.5cm;
                        size: A4;
                    }
                    
                    body {
                        print-color-adjust: exact;
                        font-size: 12px;
                    }
                    
                    /* Receipt specific styles for print */
                    .print-only .max-w-2xl {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .print-only .py-6 {
                        padding: 0 !important;
                    }
                    
                    .print-only .p-6 {
                        padding: 1rem !important;
                    }
                    
                    /* Ensure good contrast for printing */
                    .print-only {
                        background: white !important;
                        color: black !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
