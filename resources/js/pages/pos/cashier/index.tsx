import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
    Search, 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    User, 
    CreditCard,
    Receipt,
    Scan,
    Keyboard
} from 'lucide-react';
import POSLayout from '../../../layouts/pos/pos-layout';
import ProductGrid from '../../../components/pos/product-grid';
import Cart from '../../../components/pos/cart';
import CustomerSelect from '../../../components/pos/customer-select';
import PaymentModal from '../../../components/pos/payment-modal';
import QuickCustomerModal from '../../../components/pos/quick-customer-modal';
import HotkeyHelp from '../../../components/pos/hotkey-help';
import { useHotkeys } from '../../../hooks/useHotkeys';
import { toast } from 'sonner';

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

interface Category {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    customer_discount_id?: number;
    customer_discount?: {
        id: number;
        name: string;
        discount_percentage: number;
        minimum_purchase: number;
        maximum_discount?: number;
    };
}

interface CartItem {
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
    is_active: boolean;
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

interface Props {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    customerDiscounts: any[];
    paymentMethods: PaymentMethod[];
    discounts: Discount[];
    store: any;
    filters: {
        search: string;
        category_id: string;
    };
}

export default function POSCashier({ 
    products, 
    categories, 
    customers, 
    customerDiscounts,
    paymentMethods,
    discounts,
    store,
    filters 
}: Props) {
    const { auth } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [barcodeScan, setBarcodeScan] = useState('');
    const [showHotkeyHelp, setShowHotkeyHelp] = useState(false);
    
    // Refs for focus management
    const searchRef = useRef<HTMLInputElement>(null);
    const barcodeRef = useRef<HTMLInputElement>(null);

    // Filter products based on search and category
    const filteredProducts = products.filter(product => {
        const matchesSearch = !search || 
            (product.name && product.name.toLowerCase().includes(search.toLowerCase())) ||
            (product.sku && product.sku.toLowerCase().includes(search.toLowerCase())) ||
            (product.barcode && product.barcode.toLowerCase().includes(search.toLowerCase()));
        
        const matchesCategory = !selectedCategory || 
            product.category.id.toString() === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    // Add product to cart
    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            toast.error('Produk tidak tersedia');
            return;
        }

        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                toast.error('Stok tidak mencukupi');
                return;
            }
            updateCartQuantity(product.id, existingItem.quantity + 1);
        } else {
            const newItem: CartItem = {
                product,
                quantity: 1,
                unit_price: product.price,
                discount_amount: 0,
                total_amount: product.price,
            };
            setCart([...cart, newItem]);
        }
    };

    // Update cart item quantity
    const updateCartQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(cart.map(item => {
            if (item.product.id === productId) {
                if (quantity > item.product.stock) {
                    toast.error('Stok tidak mencukupi');
                    return item;
                }
                return {
                    ...item,
                    quantity,
                    total_amount: (item.unit_price * quantity) - item.discount_amount,
                };
            }
            return item;
        }));
    };

    // Remove item from cart
    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    
    // Calculate customer discount
    let customerDiscountAmount = 0;
    let customerDiscountPercentage = 0;
    
    if (selectedCustomer?.customer_discount) {
        const discountableAmount = subtotal - itemDiscounts;
        if (discountableAmount >= selectedCustomer.customer_discount.minimum_purchase) {
            customerDiscountAmount = (discountableAmount * selectedCustomer.customer_discount.discount_percentage) / 100;
            if (selectedCustomer.customer_discount.maximum_discount) {
                customerDiscountAmount = Math.min(customerDiscountAmount, selectedCustomer.customer_discount.maximum_discount);
            }
            customerDiscountPercentage = selectedCustomer.customer_discount.discount_percentage;
        }
    }

    const total = subtotal - itemDiscounts - customerDiscountAmount;

    // Handle barcode scan
    const handleBarcodeScan = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && barcodeScan.trim()) {
            const product = products.find(p => 
                (p.barcode && p.barcode === barcodeScan.trim()) || 
                (p.sku && p.sku === barcodeScan.trim())
            );
            
            if (product) {
                addToCart(product);
                setBarcodeScan('');
            } else {
                toast.error('Produk tidak ditemukan');
                setBarcodeScan('');
            }
        }
    };

    // Handle payment
    const handlePayment = () => {
        if (cart.length === 0) {
            toast.error('Keranjang belanja kosong');
            return;
        }
        setShowPaymentModal(true);
    };

    // Handle search
    const handleSearch = (value: string) => {
        setSearch(value);
        // Only update local state, no backend request for better performance
    };

    // Handle category filter
    const handleCategoryFilter = (categoryId: string) => {
        setSelectedCategory(categoryId);
        router.get(route('pos.cashier.index'), {
            search,
            category_id: categoryId,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Hotkeys configuration
    const hotkeysConfig = [
        {
            key: 'F1',
            callback: () => setShowHotkeyHelp(!showHotkeyHelp),
            description: 'Munculkan/Hilangkan bantuan hotkey',
            category: 'General'
        },
        {
            key: 'F2',
            callback: () => searchRef.current?.focus(),
            description: 'Fokus pada kotak pencarian',
            category: 'Navigation'
        },
        {
            key: 'F3',
            callback: () => barcodeRef.current?.focus(),
            description: 'Fokus pada pemindai barcode',
            category: 'Navigation'
        },
        {
            key: 'F4',
            callback: () => setShowCustomerModal(true),
            description: 'Tambah pelanggan baru',
            category: 'Customer'
        },
        {
            key: 'F9',
            callback: handlePayment,
            description: 'Proses pembayaran',
            category: 'Transaction',
            disabled: cart.length === 0
        },
        {
            key: 'F10',
            callback: clearCart,
            description: 'Bersihkan keranjang',
            category: 'Transaction',
            disabled: cart.length === 0
        },
        {
            key: 'Escape',
            callback: () => {
                setShowPaymentModal(false);
                setShowCustomerModal(false);
                setShowHotkeyHelp(false);
            },
            description: 'Tutup modal/Batalkan',
            category: 'General'
        },
        {
            key: 'Enter',
            ctrlKey: true,
            callback: handlePayment,
            description: 'Pembayaran cepat',
            category: 'Transaction',
            disabled: cart.length === 0
        }
    ];

    // Use hotkeys hook
    useHotkeys(hotkeysConfig);

    return (
        <POSLayout title="Kasir">
            <div className="grid grid-cols-12 h-full">
                {/* Left Panel - Products */}
                <div className="col-span-8 flex flex-col bg-white">
                    {/* Search and Filters */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex gap-4 mb-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    ref={searchRef}
                                    placeholder="Cari produk... (F2)"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                />
                            </div>
                            
                            {/* Barcode Scanner */}
                            <div className="relative">
                                <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    ref={barcodeRef}
                                    placeholder="Scan barcode... (F3)"
                                    value={barcodeScan}
                                    onChange={(e) => setBarcodeScan(e.target.value)}
                                    onKeyPress={handleBarcodeScan}
                                    className="pl-10 w-48 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                />
                            </div>
                            
                            {/* Hotkey Help Button */}
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowHotkeyHelp(true)}
                                className="flex items-center gap-2"
                            >
                                <Keyboard className="h-4 w-4" />
                                F1
                            </Button>
                        </div>

                        {/* Category Filters */}
                        <div className="flex gap-2 overflow-x-auto">
                            <Button
                                variant={selectedCategory === '' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleCategoryFilter('')}
                                className={selectedCategory === '' ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                            >
                                Semua
                            </Button>
                            {categories.map(category => (
                                <Button
                                    key={category.id}
                                    variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleCategoryFilter(category.id.toString())}
                                    className={selectedCategory === category.id.toString() ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-auto p-4">
                        <ProductGrid 
                            products={filteredProducts}
                            onAddToCart={addToCart}
                        />
                    </div>
                </div>

                {/* Right Panel - Cart */}
                <div className="col-span-4 bg-gray-50 border-l border-gray-200 flex flex-col">
                    {/* Cart Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Keranjang
                            </h2>
                            {cart.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCart}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Customer Selection */}
                        <CustomerSelect
                            customers={customers}
                            selectedCustomer={selectedCustomer}
                            onSelectCustomer={setSelectedCustomer}
                            onAddCustomer={() => setShowCustomerModal(true)}
                        />
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-auto">
                        <Cart
                            items={cart}
                            onUpdateQuantity={updateCartQuantity}
                            onRemoveItem={removeFromCart}
                        />
                    </div>

                    {/* Cart Summary */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            
                            {itemDiscounts > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Diskon Item:</span>
                                    <span className="text-red-600">-Rp {itemDiscounts.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            
                            {customerDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Diskon Member ({customerDiscountPercentage}%):</span>
                                    <span className="text-blue-600">-Rp {customerDiscountAmount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            
                            <div className="border-t border-gray-300 pt-2">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-green-600">Rp {total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handlePayment}
                            disabled={cart.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
                            size="lg"
                        >
                            <CreditCard className="h-5 w-5 mr-2" />
                            Bayar ({cart.length} item)
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showPaymentModal && (
                <PaymentModal
                    open={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    cart={cart}
                    customer={selectedCustomer}
                    paymentMethods={paymentMethods}
                    discounts={discounts}
                    subtotal={subtotal}
                    itemDiscounts={itemDiscounts}
                    customerDiscountAmount={customerDiscountAmount}
                    customerDiscountPercentage={customerDiscountPercentage}
                    total={total}
                    onSuccess={clearCart}
                />
            )}

            {showCustomerModal && (
                <QuickCustomerModal
                    open={showCustomerModal}
                    onClose={() => setShowCustomerModal(false)}
                    customerDiscounts={customerDiscounts}
                    onSuccess={(customer: Customer) => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                    }}
                />
            )}

            {/* Hotkey Help Modal */}
            <HotkeyHelp 
                hotkeys={hotkeysConfig}
                isVisible={showHotkeyHelp}
                onClose={() => setShowHotkeyHelp(false)}
            />
        </POSLayout>
    );
}
