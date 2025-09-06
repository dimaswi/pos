import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, X, Printer, Download } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
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

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
}

interface Payment {
    payment_method: PaymentMethod;
    amount: number;
}

interface TransactionData {
    id: string;
    transaction_number: string;
    date: string;
    items: CartItem[];
    customer: Customer | null;
    payments: Payment[];
    subtotal: number;
    item_discounts: number;
    customer_discount_amount: number;
    customer_discount_percentage: number;
    additional_discount: number;
    total_amount: number;
    paid_amount: number;
    change_amount: number;
    cashier_name: string;
    store_name: string;
    store_address?: string;
    store_phone?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    transactionData: TransactionData | null;
}

export default function ReceiptModal({ open, onClose, transactionData }: Props) {
    if (!open || !transactionData) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-content');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Struk Transaksi - ${transactionData.transaction_number}</title>
                            <style>
                                @page { margin: 10mm; }
                                body { 
                                    font-family: 'Courier New', monospace; 
                                    font-size: 11px; 
                                    margin: 0; 
                                    padding: 5px;
                                    line-height: 1.3;
                                    color: #000;
                                }
                                .receipt { 
                                    max-width: 280px; 
                                    margin: 0 auto; 
                                    background: white;
                                }
                                .header { 
                                    text-align: center; 
                                    margin-bottom: 8px; 
                                    border-bottom: 2px dashed #333; 
                                    padding-bottom: 8px; 
                                }
                                .store-name { 
                                    font-size: 16px; 
                                    font-weight: bold; 
                                    margin-bottom: 3px;
                                }
                                .store-info { 
                                    font-size: 9px; 
                                    margin: 1px 0;
                                }
                                .transaction-info { 
                                    margin: 8px 0; 
                                    font-size: 10px;
                                }
                                .info-row { 
                                    display: flex; 
                                    justify-content: space-between; 
                                    margin: 1px 0; 
                                }
                                .items-section { 
                                    margin: 8px 0; 
                                    border-top: 1px dashed #333;
                                    border-bottom: 1px dashed #333;
                                    padding: 5px 0;
                                }
                                .item { 
                                    margin: 3px 0; 
                                    font-size: 10px;
                                }
                                .item-name { 
                                    font-weight: bold; 
                                    margin-bottom: 1px;
                                }
                                .item-details { 
                                    display: flex; 
                                    justify-content: space-between; 
                                    font-size: 9px;
                                }
                                .item-price { 
                                    text-align: right; 
                                    font-weight: bold;
                                }
                                .totals { 
                                    margin: 8px 0; 
                                    font-size: 10px;
                                }
                                .total-row { 
                                    display: flex; 
                                    justify-content: space-between; 
                                    margin: 2px 0; 
                                }
                                .grand-total { 
                                    border-top: 2px solid #333; 
                                    padding-top: 3px; 
                                    font-weight: bold; 
                                    font-size: 12px;
                                }
                                .payments { 
                                    margin: 8px 0; 
                                    border-top: 1px dashed #333;
                                    padding-top: 5px;
                                    font-size: 10px;
                                }
                                .payment-row { 
                                    display: flex; 
                                    justify-content: space-between; 
                                    margin: 1px 0; 
                                }
                                .footer { 
                                    border-top: 2px dashed #333; 
                                    padding-top: 8px; 
                                    text-align: center; 
                                    font-size: 9px; 
                                    margin-top: 10px;
                                }
                                .footer p { 
                                    margin: 2px 0; 
                                }
                                .bold { font-weight: bold; }
                                .center { text-align: center; }
                                .right { text-align: right; }
                                .discount { color: #666; }
                                .change { color: #000; font-weight: bold; }
                            </style>
                        </head>
                        <body>
                            <div class="receipt">
                                <div class="header">
                                    <div class="store-name">${transactionData.store_name}</div>
                                    ${transactionData.store_address ? `<div class="store-info">${transactionData.store_address}</div>` : ''}
                                    ${transactionData.store_phone ? `<div class="store-info">Tel: ${transactionData.store_phone}</div>` : ''}
                                </div>
                                
                                <div class="transaction-info">
                                    <div class="info-row">
                                        <span>No. Transaksi:</span>
                                        <span class="bold">${transactionData.transaction_number}</span>
                                    </div>
                                    <div class="info-row">
                                        <span>Tanggal:</span>
                                        <span>${new Date(transactionData.date).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div class="info-row">
                                        <span>Kasir:</span>
                                        <span>${transactionData.cashier_name}</span>
                                    </div>
                                    ${transactionData.customer ? `
                                    <div class="info-row">
                                        <span>Customer:</span>
                                        <span>${transactionData.customer.name}</span>
                                    </div>` : ''}
                                </div>
                                
                                <div class="items-section">
                                    ${transactionData.items.map(item => `
                                    <div class="item">
                                        <div class="item-name">${item.product.name}</div>
                                        <div class="item-details">
                                            <span>${item.quantity} x Rp ${item.unit_price.toLocaleString('id-ID')}${item.discount_amount > 0 ? ` (-Rp ${item.discount_amount.toLocaleString('id-ID')})` : ''}</span>
                                            <span class="item-price">Rp ${item.total_amount.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                                
                                <div class="totals">
                                    <div class="total-row">
                                        <span>Subtotal:</span>
                                        <span>Rp ${transactionData.subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    ${transactionData.item_discounts > 0 ? `
                                    <div class="total-row discount">
                                        <span>Diskon Item:</span>
                                        <span>-Rp ${transactionData.item_discounts.toLocaleString('id-ID')}</span>
                                    </div>` : ''}
                                    ${transactionData.customer_discount_amount > 0 ? `
                                    <div class="total-row discount">
                                        <span>Diskon Member (${transactionData.customer_discount_percentage}%):</span>
                                        <span>-Rp ${transactionData.customer_discount_amount.toLocaleString('id-ID')}</span>
                                    </div>` : ''}
                                    ${transactionData.additional_discount > 0 ? `
                                    <div class="total-row discount">
                                        <span>Diskon Tambahan:</span>
                                        <span>-Rp ${transactionData.additional_discount.toLocaleString('id-ID')}</span>
                                    </div>` : ''}
                                    <div class="total-row grand-total">
                                        <span>TOTAL:</span>
                                        <span>Rp ${transactionData.total_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                
                                <div class="payments">
                                    ${transactionData.payments.map(payment => `
                                    <div class="payment-row">
                                        <span>${payment.payment_method.name}:</span>
                                        <span>Rp ${payment.amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    `).join('')}
                                    <div class="payment-row bold">
                                        <span>Total Bayar:</span>
                                        <span>Rp ${transactionData.paid_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    ${transactionData.change_amount > 0 ? `
                                    <div class="payment-row change">
                                        <span>Kembalian:</span>
                                        <span>Rp ${transactionData.change_amount.toLocaleString('id-ID')}</span>
                                    </div>` : ''}
                                </div>
                                
                                <div class="footer">
                                    <p>==================================</p>
                                    <p class="bold">Terima kasih atas kunjungan Anda!</p>
                                    <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
                                    <p>==================================</p>
                                    <p>Powered by POS System</p>
                                </div>
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    const handleDownload = () => {
        // Implement PDF download functionality here
        console.log('Download receipt as PDF');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-w-lg w-full max-h-[95vh] border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <Receipt className="h-6 w-6" />
                        Struk Transaksi
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div id="receipt-content" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                        {/* Store Info */}
                        <div className="text-center border-b border-dashed border-gray-400 pb-6">
                            <h3 className="font-bold text-2xl text-gray-900 mb-2">{transactionData.store_name}</h3>
                            {transactionData.store_address && (
                                <p className="text-sm text-gray-600 mb-1">{transactionData.store_address}</p>
                            )}
                            {transactionData.store_phone && (
                                <p className="text-sm text-gray-600">Telp: {transactionData.store_phone}</p>
                            )}
                        </div>

                        {/* Transaction Info */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600 font-medium">No. Transaksi</div>
                                    <div className="font-bold text-gray-900">{transactionData.transaction_number}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 font-medium">Tanggal</div>
                                    <div className="font-bold text-gray-900">{new Date(transactionData.date).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 font-medium">Kasir</div>
                                    <div className="font-bold text-gray-900">{transactionData.cashier_name}</div>
                                </div>
                                {transactionData.customer && (
                                    <div>
                                        <div className="text-gray-600 font-medium">Customer</div>
                                        <div className="font-bold text-gray-900">{transactionData.customer.name}</div>
                                        {transactionData.customer.customer_discount && (
                                            <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                                                Member {transactionData.customer.customer_discount.name}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                Detail Pembelian
                            </h4>
                            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                                {transactionData.items.map((item, index) => (
                                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 text-base">{item.product.name}</div>
                                                <div className="text-gray-500 text-sm mt-1">SKU: {item.product.sku}</div>
                                                <div className="flex items-center gap-4 mt-2 text-sm">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                                        {item.quantity} item
                                                    </span>
                                                    <span className="text-gray-600">
                                                        @ Rp {item.unit_price.toLocaleString('id-ID')}
                                                    </span>
                                                    {item.discount_amount > 0 && (
                                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                                            Diskon -Rp {item.discount_amount.toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="font-bold text-xl text-gray-900">
                                                    Rp {item.total_amount.toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                Ringkasan Pembayaran
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">Rp {transactionData.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                
                                {transactionData.item_discounts > 0 && (
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Diskon Item</span>
                                        <span className="text-red-600 font-semibold">-Rp {transactionData.item_discounts.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                {transactionData.customer_discount_amount > 0 && (
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">
                                            Diskon Member ({transactionData.customer_discount_percentage}%)
                                        </span>
                                        <span className="text-red-600 font-semibold">
                                            -Rp {transactionData.customer_discount_amount.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {transactionData.additional_discount > 0 && (
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Diskon Tambahan</span>
                                        <span className="text-red-600 font-semibold">-Rp {transactionData.additional_discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                <div className="border-t border-gray-300 pt-3 mt-4">
                                    <div className="flex justify-between items-center bg-green-100 rounded-lg p-3 border border-green-200">
                                        <span className="text-lg font-bold text-green-800">TOTAL PEMBAYARAN</span>
                                        <span className="text-2xl font-bold text-green-800">Rp {transactionData.total_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payments */}
                        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                                Metode Pembayaran
                            </h4>
                            <div className="space-y-3">
                                {transactionData.payments.map((payment, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3 border border-blue-200">
                                        <span className="font-medium text-gray-700">{payment.payment_method.name}</span>
                                        <span className="font-bold text-gray-900">Rp {payment.amount.toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                                <div className="border-t border-blue-300 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-blue-800">Total Dibayar</span>
                                        <span className="font-bold text-xl text-blue-800">Rp {transactionData.paid_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    {transactionData.change_amount > 0 && (
                                        <div className="flex justify-between items-center mt-2 bg-green-100 rounded-lg p-3 border border-green-200">
                                            <span className="font-bold text-green-800">Kembalian</span>
                                            <span className="font-bold text-xl text-green-800">Rp {transactionData.change_amount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center py-6 border-t border-dashed border-gray-400">
                            <div className="space-y-2">
                                <p className="text-lg font-bold text-gray-900">🙏 Terima kasih atas kunjungan Anda! 🙏</p>
                                <p className="text-sm text-gray-600">Barang yang sudah dibeli tidak dapat dikembalikan</p>
                                <p className="text-sm text-gray-600">Silakan simpan struk ini sebagai bukti pembelian</p>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">Powered by POS System • {new Date().getFullYear()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-6 bg-white">
                    <div className="flex gap-3">
                        <Button
                            onClick={handlePrint}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                            size="lg"
                        >
                            <Printer className="h-5 w-5 mr-2" />
                            Print Struk
                        </Button>
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="flex-1 border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 shadow-lg transform hover:scale-105 transition-all duration-200"
                            size="lg"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Download PDF
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-lg transform hover:scale-105 transition-all duration-200"
                            size="lg"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
