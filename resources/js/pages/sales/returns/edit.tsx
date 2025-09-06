import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/app-layout';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Store {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface ReturnItem {
    id: number;
    sales_item_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    refund_amount: number;
    reason: string;
    condition: string;
    max_quantity?: number;
}

interface SalesItem {
    id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    discount_amount: number;
}

interface SalesTransaction {
    id: number;
    transaction_number: string;
    sales_items: SalesItem[];
}

interface SalesReturn {
    id: number;
    return_number: string;
    sales_transaction: SalesTransaction;
    store: Store;
    return_date: string;
    reason: string;
    refund_amount: number;
    status: string;
    return_items: ReturnItem[];
}

interface Props {
    return: SalesReturn;
    stores: Store[];
}

export default function Edit({ return: returnData, stores }: Props) {
    const [returnItems, setReturnItems] = useState<ReturnItem[]>(returnData.return_items);
    
    // Format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
        return dateString.split('T')[0]; // Extract YYYY-MM-DD from ISO string
    };
    
    const { data, setData, put, processing, errors } = useForm({
        return_date: formatDateForInput(returnData.return_date),
        reason: returnData.reason,
        return_items: returnData.return_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            reason: item.reason,
            condition: item.condition,
        })),
    });

    const updateReturnItem = (index: number, field: string, value: any) => {
        const updatedItems = [...returnItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // Recalculate refund amount
        if (field === 'quantity') {
            updatedItems[index].refund_amount = Number(value) * Number(updatedItems[index].unit_price);
        }
        
        setReturnItems(updatedItems);
        
        // Update form data
        const formItems = updatedItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            reason: item.reason,
            condition: item.condition,
        }));
        setData('return_items', formItems);
    };

    const getTotalRefundAmount = () => {
        return returnItems.reduce((total, item) => {
            return total + Number(item.refund_amount);
        }, 0);
    };

    const getTotalReturnItems = () => {
        return returnItems.reduce((total, item) => total + item.quantity, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(route('sales.returns.update', returnData.id), {
            onSuccess: () => {
                toast.success('Retur berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui retur');
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Penjualan', href: '#' },
                { title: 'Retur', href: route('sales.returns.index') },
                { title: returnData.return_number, href: route('sales.returns.show', returnData.id) },
                { title: 'Edit', href: route('sales.returns.edit', returnData.id) }
            ]}
        >
            <Head title={`Edit Retur: ${returnData.return_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={route('sales.returns.show', returnData.id)}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Kembali
                                </Button>
                            </Link>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Edit Permintaan Retur
                            </h2>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Transaction Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Transaksi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">No. Retur</Label>
                                        <p className="text-lg font-semibold">{returnData.return_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">No. Transaksi</Label>
                                        <p className="text-lg">{returnData.sales_transaction?.transaction_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Toko</Label>
                                        <p className="text-lg">{returnData.store?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Return Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Retur</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="return_date">Tanggal Retur</Label>
                                    <Input
                                        id="return_date"
                                        type="date"
                                        value={data.return_date}
                                        onChange={(e) => setData('return_date', e.target.value)}
                                        required
                                    />
                                    {errors.return_date && (
                                        <p className="text-sm text-red-600 mt-1">{errors.return_date}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <Label htmlFor="reason">Alasan Retur</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Jelaskan alasan untuk retur ini..."
                                        value={data.reason}
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

                        {/* Return Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Barang Retur</CardTitle>
                                <CardDescription>
                                    Perbarui barang dan detail returnya
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Qty Retur</TableHead>
                                            <TableHead>Harga Satuan</TableHead>
                                            <TableHead>Kondisi</TableHead>
                                            <TableHead>Alasan</TableHead>
                                            <TableHead>Jumlah Refund</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {returnItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.product.name}
                                                </TableCell>
                                                <TableCell>{item.product.sku}</TableCell>
                                                <TableCell> 
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={item.max_quantity || 999}
                                                        value={item.quantity}
                                                        onChange={(e) => updateReturnItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>Rp {Number(item.unit_price).toLocaleString('id-ID')}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={item.condition}
                                                        onValueChange={(value) => updateReturnItem(index, 'condition', value)}
                                                    >
                                                        <SelectTrigger className="w-32">
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
                                                        placeholder="Alasan retur barang..."
                                                        value={item.reason}
                                                        onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                                                        className="w-40"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    Rp {Number(item.refund_amount).toLocaleString('id-ID')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                
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
                            </CardContent>
                        </Card>

                        {/* Form Actions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-end space-x-4">
                                    <Link href={route('sales.returns.show', returnData.id)}>
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Memperbarui...' : 'Perbarui Retur'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
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
