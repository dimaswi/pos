import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/app-layout';
import { toast } from 'sonner';

interface Store {
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
    price: number;
    stock: number;
}

interface Discount {
    id: number;
    name: string;
    code: string;
    type: string;
}

interface SalesItem {
    id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
}

interface SalesTransaction {
    id: number;
    transaction_number: string;
    store: Store;
    customer?: Customer;
    transaction_date: string;
    notes?: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    status: string;
    discount?: Discount;
    sales_items: SalesItem[];
}

interface Props {
    transaction: SalesTransaction;
    stores: Store[];
    customers: Customer[];
    products: Product[];
    discounts: Discount[];
}

export default function Edit({ transaction, stores, customers, products, discounts }: Props) {
    const [salesItems, setSalesItems] = useState<any[]>(
        transaction.sales_items.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_price: item.unit_price,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            total_price: item.total_price,
        }))
    );

    const { data, setData, put, processing, errors } = useForm({
        store_id: transaction.store.id,
        customer_id: transaction.customer?.id || '',
        transaction_date: transaction.transaction_date,
        notes: transaction.notes || '',
        discount_id: transaction.discount?.id || '',
        sales_items: salesItems,
    });

    const addSalesItem = () => {
        setSalesItems([...salesItems, {
            product_id: '',
            product_name: '',
            product_price: 0,
            quantity: 1,
            unit_price: 0,
            discount_amount: 0,
            total_price: 0,
        }]);
    };

    const removeSalesItem = (index: number) => {
        const updatedItems = salesItems.filter((_, i) => i !== index);
        setSalesItems(updatedItems);
        setData('sales_items', updatedItems);
    };

    const updateSalesItem = (index: number, field: string, value: any) => {
        const updatedItems = [...salesItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // If product is selected, update price
        if (field === 'product_id') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                updatedItems[index].product_name = product.name;
                updatedItems[index].product_price = product.price;
                updatedItems[index].unit_price = product.price;
            }
        }

        // Recalculate total price
        if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount') {
            const quantity = updatedItems[index].quantity || 0;
            const unitPrice = updatedItems[index].unit_price || 0;
            const discountAmount = updatedItems[index].discount_amount || 0;
            updatedItems[index].total_price = (quantity * unitPrice) - discountAmount;
        }

        setSalesItems(updatedItems);
        setData('sales_items', updatedItems);
    };

    const calculateSubtotal = () => {
        return salesItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountAmount = 0; // This would be calculated based on selected discount
        const taxAmount = subtotal * 0.1; // 10% tax, adjust as needed
        return subtotal - discountAmount + taxAmount;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate that there are items
        if (salesItems.length === 0 || salesItems.every(item => !item.product_id)) {
            toast.error('Please add at least one product');
            return;
        }

        put(route('sales.transactions.update', transaction.id), {
            onSuccess: () => {
                toast.success('Transaction updated successfully');
            },
            onError: () => {
                toast.error('Failed to update transaction');
            }
        });
    };

    useEffect(() => {
        setData('sales_items', salesItems);
    }, [salesItems]);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { title: 'Sales', href: '#' },
                { title: 'Transactions', href: route('sales.transactions.index') },
                { title: transaction.transaction_number, href: route('sales.transactions.show', transaction.id) },
                { title: 'Edit', href: route('sales.transactions.edit', transaction.id) }
            ]}
        >
            <Head title={`Edit Transaction: ${transaction.transaction_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={route('sales.transactions.show', transaction.id)}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Edit Transaction
                            </h2>
                        </div>
                        <Badge variant="outline">{transaction.transaction_number}</Badge>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Transaction Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaction Information</CardTitle>
                                <CardDescription>
                                    Update the basic transaction details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="store_id">Store *</Label>
                                        <Select 
                                            value={data.store_id.toString()} 
                                            onValueChange={(value) => setData('store_id', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select store" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stores.map((store) => (
                                                    <SelectItem key={store.id} value={store.id.toString()}>
                                                        {store.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.store_id && (
                                            <p className="text-sm text-red-600 mt-1">{errors.store_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="customer_id">Customer</Label>
                                        <Select 
                                            value={data.customer_id.toString()} 
                                            onValueChange={(value) => setData('customer_id', value ? parseInt(value) : '')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select customer (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Guest Customer</SelectItem>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.customer_id && (
                                            <p className="text-sm text-red-600 mt-1">{errors.customer_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="transaction_date">Transaction Date *</Label>
                                        <Input
                                            id="transaction_date"
                                            type="date"
                                            value={data.transaction_date}
                                            onChange={(e) => setData('transaction_date', e.target.value)}
                                            required
                                        />
                                        {errors.transaction_date && (
                                            <p className="text-sm text-red-600 mt-1">{errors.transaction_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Enter any additional notes..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sales Items */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Sales Items</CardTitle>
                                        <CardDescription>
                                            Update the products and quantities in this transaction
                                        </CardDescription>
                                    </div>
                                    <Button type="button" onClick={addSalesItem} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Unit Price</TableHead>
                                            <TableHead>Discount</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salesItems.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Select
                                                        value={item.product_id.toString()}
                                                        onValueChange={(value) => updateSalesItem(index, 'product_id', value)}
                                                    >
                                                        <SelectTrigger className="w-48">
                                                            <SelectValue placeholder="Select product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map((product) => (
                                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                                    {product.name} - ${product.price}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateSalesItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateSalesItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.discount_amount}
                                                        onChange={(e) => updateSalesItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    ${item.total_price?.toFixed(2) || '0.00'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeSalesItem(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {salesItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    No items added. Click "Add Item" to start.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Transaction Summary */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tax (10%):</span>
                                            <span className="font-semibold">${(calculateSubtotal() * 0.1).toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total:</span>
                                            <span>${calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Form Actions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-end space-x-4">
                                    <Link href={route('sales.transactions.show', transaction.id)}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing || salesItems.length === 0}>
                                        {processing ? 'Updating...' : 'Update Transaction'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
