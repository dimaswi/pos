import React, { useState } from 'react';
import { X, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

interface ProductSelectionModalProps {
    products: ProductData[];
    isOpen: boolean;
    onClose: () => void;
    onSelectProduct: (product: ProductData) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function ProductSelectionModal({ 
    products, 
    isOpen, 
    onClose, 
    onSelectProduct 
}: ProductSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = (products || []).filter(product => {
        if (!product) return false;
        const searchLower = searchQuery.toLowerCase();
        return (
            (product.name || '').toLowerCase().includes(searchLower) ||
            (product.sku || '').toLowerCase().includes(searchLower) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchLower)) ||
            (product.category_name || '').toLowerCase().includes(searchLower)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Pilih Produk
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Cari dan pilih produk untuk ditambahkan ke transaksi
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-6 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Cari produk berdasarkan nama, SKU, barcode, atau kategori..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product: any) => {
                                // Fix: Handle undefined/null stock_quantity values
                                const stockQuantity = Number(product.stock_quantity) || 0;
                                const isOutOfStock = stockQuantity <= 0;
                                
                                // Render card tanpa onClick untuk produk habis
                                if (isOutOfStock) {
                                    return (
                                        <div
                                            key={product.id}
                                            className="border rounded-lg p-4 bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-medium line-clamp-2 text-gray-500">
                                                    {product.name}
                                                </h3>
                                                <Badge 
                                                    variant="destructive"
                                                    className="ml-2 flex-shrink-0"
                                                >
                                                    Habis
                                                </Badge>
                                            </div>
                                        
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div>SKU: {product.sku}</div>
                                                {product.barcode && (
                                                    <div>Barcode: {product.barcode}</div>
                                                )}
                                                <div>Stok: {stockQuantity} {product.unit}</div>
                                                <div>Kategori: {product.category_name}</div>
                                            </div>
                                            
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="text-lg font-semibold text-gray-400">
                                                    {formatCurrency(product.selling_price)}
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    disabled={true}
                                                    className="flex items-center gap-1"
                                                >
                                                    <ShoppingCart className="h-3 w-3" />
                                                    Habis
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                // Render card normal untuk produk tersedia
                                return (
                                    <div
                                        key={product.id}
                                        className="border rounded-lg p-4 transition-shadow hover:shadow-md cursor-pointer bg-white border-gray-300"
                                        onClick={() => onSelectProduct(product)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium line-clamp-2 text-gray-900">
                                                {product.name}
                                            </h3>
                                            <Badge 
                                                variant="default"
                                                className="ml-2 flex-shrink-0"
                                            >
                                                Tersedia
                                            </Badge>
                                        </div>
                                    
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div>SKU: {product.sku}</div>
                                            {product.barcode && (
                                                <div>Barcode: {product.barcode}</div>
                                            )}
                                            <div>Stok: {stockQuantity} {product.unit}</div>
                                            <div>Kategori: {product.category_name}</div>
                                        </div>
                                        
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="text-lg font-semibold text-green-600">
                                                {formatCurrency(product.selling_price)}
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="flex items-center gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectProduct(product);
                                                }}
                                            >
                                                <ShoppingCart className="h-3 w-3" />
                                                Pilih
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchQuery ? "Produk tidak ditemukan" : "Tidak ada produk"}
                            </h3>
                            <p className="text-gray-500">
                                {searchQuery 
                                    ? `Tidak ada produk yang cocok dengan pencarian "${searchQuery}"`
                                    : "Belum ada produk yang tersedia"
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {filteredProducts.length} produk ditemukan
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            Tutup
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
