import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string;
    price: number;
    image?: string;
    category: {
        id: number;
        name: string;
    };
    stock: number;
}

interface Props {
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, onAddToCart }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
                <Card 
                    key={product.id}
                    className="bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                    onClick={() => onAddToCart(product)}
                >
                    <CardContent className="p-3">
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <Package className="h-12 w-12 text-gray-400" />
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-2">
                            <div>
                                <h3 className="font-medium text-gray-900 text-sm truncate">
                                    {product.name}
                                </h3>
                                <p className="text-xs text-gray-500">{product.sku}</p>
                            </div>

                            {/* Category Badge */}
                            <Badge 
                                variant="secondary" 
                                className="text-xs bg-gray-100 text-gray-600"
                            >
                                {product.category.name}
                            </Badge>

                            {/* Price and Stock */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-green-600">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Stock: {product.stock}
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={product.stock <= 0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToCart(product);
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Out of Stock Overlay */}
                            {product.stock <= 0 && (
                                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                                    <Badge variant="destructive">Stok Habis</Badge>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {products.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Tidak ada produk ditemukan</p>
                </div>
            )}
        </div>
    );
}
