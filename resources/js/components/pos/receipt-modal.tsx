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
                                @page { margin: 5mm; }
                                body { 
                                    font-family: 'Courier New', monospace; 
                                    font-size: 16px; 
                                    margin: 0; 
                                    padding: 1px;
                                    line-height: 1.3;
                                    color: #000;
                                    background: white;
                                }
                                .receipt { 
                                    width: 210mm; 
                                    margin: 0 auto;
                                    background: white;
                                    padding: 2mm;
                                }
                                .header { 
                                    text-align: left; 
                                    margin-bottom: 5mm; 
                                    border: 1px solid #000;
                                    padding: 3mm;
                                    background: #f8f8f8;
                                }
                                .store-name { 
                                    font-size: 18px; 
                                    font-weight: bold; 
                                    margin-bottom: 1mm;
                                    text-transform: uppercase;
                                }
                                .store-info { 
                                    font-size: 16px; 
                                    margin: 0.5mm 0;
                                    line-height: 1.3;
                                }
                                .transaction-info { 
                                    margin: 2mm 0; 
                                    font-size: 16px;
                                    border: 1px solid #000;
                                    padding: 1mm;
                                }
                                .info-row { 
                                    display: flex; 
                                    justify-content: space-between; 
                                    margin: 0.5mm 0; 
                                    padding: 0.3mm 0;
                                    border-bottom: 1px dotted #ccc;
                                }
                                table { 
                                    width: 100%;
                                    border-collapse: collapse;
                                    font-family: 'Courier New', monospace;
                                    font-size: 16px;
                                }
                                th, td {
                                    border: 1px solid #000;
                                    padding: 1mm;
                                    text-align: left;
                                }
                                th {
                                    font-weight: bold;
                                }
                                .text-center { text-align: center !important; }
                                .text-right { text-align: right !important; }
                                .footer { 
                                    border: 1px solid #000; 
                                    padding: 2mm; 
                                    text-align: left; 
                                    font-size: 16px; 
                                    margin-top: 3mm;
                                    background: #f8f8f8;
                                }
                                .footer p { 
                                    margin: 1mm 0; 
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
                                <!-- Header -->
                                <div style="margin-bottom: 3mm;">
                                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 2mm;">
                                        <div style="width: 48%;">
                                            <div class="store-name">${transactionData.store_name}</div>
                                            ${transactionData.store_address ? `<div class="store-info">${transactionData.store_address}</div>` : ''}
                                            ${transactionData.store_phone ? `<div class="store-info">Telp: ${transactionData.store_phone}</div>` : ''}
                                        </div>
                                        <div style="width: 48%; text-align: right;">
                                            <div style="font-weight: bold; font-size: 18px; border: 1px solid #000; padding: 1.5mm; background: #f0f0f0; display: inline-block;">NOTA PENJUALAN</div>
                                            <div style="font-size: 16px; margin-top: 0.5mm; font-weight: bold;">No: ${transactionData.transaction_number}</div>
                                        </div>
                                    </div>
                                </div>

                                            <!-- Transaction Info -->
                                <div style="border: 1px solid #000; padding: 2mm; margin-bottom: 2mm;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm;">
                                        <div style="width: 30%;">
                                            <div style="font-weight: bold; font-size: 16px;">Tanggal</div>
                                            <div style="font-size: 16px;">${new Date(transactionData.date).toLocaleDateString('id-ID')}</div>
                                        </div>
                                        <div style="width: 30%;">
                                            <div style="font-weight: bold; font-size: 16px;">Jam</div>
                                            <div style="font-size: 16px;">${new Date(transactionData.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div style="width: 30%;">
                                            <div style="font-weight: bold; font-size: 16px;">Kasir</div>
                                            <div style="font-size: 16px;">${transactionData.cashier_name}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #ccc; padding-top: 1mm;">
                                        <div style="width: 48%;">
                                            <div style="font-weight: bold; font-size: 16px;">Customer</div>
                                            <div style="font-size: 16px;">${transactionData.customer ? transactionData.customer.name : 'UMUM'}</div>
                                        </div>
                                        <div style="width: 48%;">
                                            <div style="font-weight: bold; font-size: 16px;">Member Disc</div>
                                            <div style="font-size: 16px;">${transactionData.customer?.customer_discount ? `${transactionData.customer.customer_discount.name} (${transactionData.customer_discount_percentage}%)` : '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Items Table -->
                                <div style="border: 1px solid #000; margin-bottom: 2mm;">
                                    <table style="width: 100%; font-family: 'Courier New', monospace; font-size: 16px; border-collapse: collapse;">
                                        <thead>
                                            <tr style="border-bottom: 1px solid #000;">
                                                <th style="border-right: 1px solid #000; padding: 1.5mm; text-align: center; font-weight: bold;">NO</th>
                                                <th style="border-right: 1px solid #000; padding: 1.5mm; text-align: left; font-weight: bold;">NAMA BARANG</th>
                                                <th style="border-right: 1px solid #000; padding: 1.5mm; text-align: center; font-weight: bold;">QTY</th>
                                                <th style="border-right: 1px solid #000; padding: 1.5mm; text-align: right; font-weight: bold;">HARGA SATUAN</th>
                                                <th style="border-right: 1px solid #000; padding: 1.5mm; text-align: right; font-weight: bold;">DISKON</th>
                                                <th style="padding: 1.5mm; text-align: right; font-weight: bold;">JUMLAH</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${transactionData.items.map((item, index) => `
                                            <tr style="border-bottom: 1px dotted #ccc;">
                                                <td style="border-right: 1px solid #000; padding: 1mm; text-align: center;">${index + 1}</td>
                                                <td style="border-right: 1px solid #000; padding: 1mm;">
                                                    <div style="font-weight: bold;">${item.product.name}</div>
                                                </td>
                                                <td style="border-right: 1px solid #000; padding: 1mm; text-align: center;">${item.quantity}</td>
                                                <td style="border-right: 1px solid #000; padding: 1mm; text-align: right;">Rp ${item.unit_price.toLocaleString('id-ID')}</td>
                                                <td style="border-right: 1px solid #000; padding: 1mm; text-align: right;">${item.discount_amount > 0 ? `Rp ${item.discount_amount.toLocaleString('id-ID')}` : '-'}</td>
                                                <td style="padding: 1mm; text-align: right; font-weight: bold;">Rp ${item.total_amount.toLocaleString('id-ID')}</td>
                                            </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Summary & Payment Section -->
                                <div style="border: 1px solid #000; padding: 2mm; margin-bottom: 2mm;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;">
                                        <span style="font-weight: bold; font-size: 16px;">SUBTOTAL</span>
                                        <span style="font-weight: bold; font-size: 16px;">Rp ${transactionData.subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    
                                    ${transactionData.item_discounts > 0 ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                                        <span style="font-size: 16px;">Diskon Item</span>
                                        <span style="font-weight: bold; font-size: 16px;">-Rp ${transactionData.item_discounts.toLocaleString('id-ID')}</span>
                                    </div>` : ''}
                                    
                                    ${transactionData.customer_discount_amount > 0 ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                                        <span style="font-size: 16px;">Diskon Member (${transactionData.customer_discount_percentage}%)</span>
                                        <span style="font-weight: bold; font-size: 16px;">-Rp ${transactionData.customer_discount_amount.toLocaleString('id-ID')}</span>
                                    </div>` : ''}

                                    ${transactionData.additional_discount > 0 ? `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                                        <span style="font-size: 16px;">Diskon Tambahan</span>
                                        <span style="font-weight: bold; font-size: 16px;">-Rp ${transactionData.additional_discount.toLocaleString('id-ID')}</span>
                                    </div>` : ''}
                                    
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1mm; border-top: 1px solid #ccc; padding-top: 1mm;">
                                        <span style="font-weight: bold; font-size: 16px;">TOTAL PEMBAYARAN</span>
                                        <span style="font-weight: bold; font-size: 16px;">Rp ${transactionData.total_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                                        <span style="font-weight: bold; font-size: 16px;">TOTAL BAYAR</span>
                                        <span style="font-weight: bold; font-size: 16px;">Rp ${transactionData.paid_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    
                                    ${transactionData.change_amount > 0 ? `
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="font-weight: bold; font-size: 16px;">KEMBALIAN</span>
                                        <span style="font-weight: bold; font-size: 16px;">Rp ${transactionData.change_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    ` : ''}
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-w-5xl w-full max-h-[95vh] border border-gray-200">
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
                <div className="flex-1 overflow-y-auto p-2 bg-gray-100">
                    <div id="receipt-content" className="bg-white border border-gray-400 font-mono text-xs leading-tight p-3 mx-auto" style={{ width: '100%', maxWidth: '800px', fontFamily: 'Courier New, monospace' }}>
                        {/* Header */}
                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-4 border-b border-black pb-3">
                                <div className="text-left">
                                    <h3 className="font-bold text-sm uppercase tracking-wide text-gray-900">{transactionData.store_name}</h3>
                                    {transactionData.store_address && (
                                        <p className="text-xs text-gray-700">{transactionData.store_address}</p>
                                    )}
                                    {transactionData.store_phone && (
                                        <p className="text-xs text-gray-700">Telp: {transactionData.store_phone}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm border border-black px-4 py-2 bg-gray-100 inline-block">NOTA PENJUALAN</div>
                                    <div className="text-xs mt-1 font-bold">No: {transactionData.transaction_number}</div>
                                </div>
                            </div>
                        </div>



                        {/* Transaction Info */}
                        <div className="border border-black p-3 mb-3">
                            <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                                <div>
                                    <div className="font-bold">Tanggal</div>
                                    <div>{new Date(transactionData.date).toLocaleDateString('id-ID')}</div>
                                </div>
                                <div>
                                    <div className="font-bold">Jam</div>
                                    <div>{new Date(transactionData.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div>
                                    <div className="font-bold">Kasir</div>
                                    <div>{transactionData.cashier_name}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-gray-300">
                                <div>
                                    <div className="font-bold">Customer</div>
                                    <div>{transactionData.customer ? transactionData.customer.name : 'UMUM'}</div>
                                </div>
                                <div>
                                    <div className="font-bold">Member Disc</div>
                                    <div>{transactionData.customer?.customer_discount ? `${transactionData.customer.customer_discount.name} (${transactionData.customer_discount_percentage}%)` : '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-black mb-3">
                            <table className="w-full font-mono text-xs">
                                <thead>
                                    <tr className="border-b border-black">
                                        <th className="border-r border-black p-2 text-center font-bold">NO</th>
                                        <th className="border-r border-black p-2 text-left font-bold">NAMA BARANG</th>
                                        <th className="border-r border-black p-2 text-center font-bold">QTY</th>
                                        <th className="border-r border-black p-2 text-right font-bold">HARGA SATUAN</th>
                                        <th className="border-r border-black p-2 text-right font-bold">DISKON</th>
                                        <th className="p-2 text-right font-bold">JUMLAH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionData.items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-400">
                                            <td className="border-r border-black p-2 text-center">{index + 1}</td>
                                            <td className="border-r border-black p-2">
                                                <div className="font-bold">{item.product.name}</div>
                                            </td>
                                            <td className="border-r border-black p-2 text-center">{item.quantity}</td>
                                            <td className="border-r border-black p-2 text-right">Rp {item.unit_price.toLocaleString('id-ID')}</td>
                                            <td className="border-r border-black p-2 text-right">{item.discount_amount > 0 ? `Rp ${item.discount_amount.toLocaleString('id-ID')}` : '-'}</td>
                                            <td className="p-2 text-right font-bold">Rp {item.total_amount.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Payment Section */}
                        <div className="border border-black p-3 mb-3">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold">SUBTOTAL</span>
                                    <span className="font-bold">Rp {transactionData.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                
                                {transactionData.item_discounts > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Diskon Item</span>
                                        <span className="font-bold">-Rp {transactionData.item_discounts.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                {transactionData.customer_discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Diskon Member ({transactionData.customer_discount_percentage}%)</span>
                                        <span className="font-bold">-Rp {transactionData.customer_discount_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                {transactionData.additional_discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Diskon Tambahan</span>
                                        <span className="font-bold">-Rp {transactionData.additional_discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                                    <span>TOTAL PEMBAYARAN</span>
                                    <span>Rp {transactionData.total_amount.toLocaleString('id-ID')}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm font-bold">
                                    <span>TOTAL BAYAR</span>
                                    <span>Rp {transactionData.paid_amount.toLocaleString('id-ID')}</span>
                                </div>
                                
                                {transactionData.change_amount > 0 && (
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>KEMBALIAN</span>
                                        <span>Rp {transactionData.change_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-4 bg-white">
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
