import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    image?: string;
    stock: number;
}

interface CartItem {
    product: Product;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
}

interface Props {
    items: CartItem[];
    onUpdateQuantity: (productId: number, quantity: number) => void;
    onRemoveItem: (productId: number) => void;
}

export default function Cart({ items, onUpdateQuantity, onRemoveItem }: Props) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">Keranjang kosong</p>
                <p className="text-gray-500 text-sm">Pilih produk untuk memulai transaksi</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            {items.map((item) => (
                <div 
                    key={item.product.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                    {/* Product Info */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                                {item.product.name}
                            </h4>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-green-600">
                                    Rp {item.unit_price.toLocaleString('id-ID')}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Stock: {item.product.stock}
                                </span>
                            </div>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0 border-gray-300 text-gray-600 hover:bg-gray-100"
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            
                            <Input
                                type="number"
                                min="1"
                                max={item.product.stock}
                                value={item.quantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    onUpdateQuantity(item.product.id, value);
                                }}
                                className="w-16 h-8 text-center bg-white border-gray-300 text-gray-900"
                            />
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                                className="h-8 w-8 p-0 border-gray-300 text-gray-600 hover:bg-gray-100"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                            <div className="font-semibold text-gray-900">
                                Rp {item.total_amount.toLocaleString('id-ID')}
                            </div>
                            {item.discount_amount > 0 && (
                                <div className="text-xs text-red-600">
                                    -Rp {item.discount_amount.toLocaleString('id-ID')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning if quantity exceeds stock */}
                    {item.quantity > item.product.stock && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                            ⚠ Jumlah melebihi stok tersedia ({item.product.stock})
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
