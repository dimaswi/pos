import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';

interface CustomerDiscount {
    id: number;
    name: string;
    discount_percentage: number;
    minimum_purchase: number;
    maximum_discount?: number;
}

interface Customer {
    id: number;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    customer_discount_id?: number;
    customer_discount?: CustomerDiscount;
}

interface Props {
    open: boolean;
    onClose: () => void;
    customerDiscounts: CustomerDiscount[];
    onSuccess: (customer: Customer) => void;
}

export default function QuickCustomerModal({
    open,
    onClose,
    customerDiscounts,
    onSuccess
}: Props) {
    const { props } = usePage();
    const csrfToken = (props as any).csrf_token;
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        customer_discount_id: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Nama pelanggan wajib diisi');
            return;
        }

        setLoading(true);

        try {
            // Use CSRF token from Inertia props
            console.log('CSRF Token:', csrfToken);
            if (!csrfToken) {
                console.error('CSRF token not found in Inertia props');
                toast.error('Token keamanan tidak ditemukan. Refresh halaman dan coba lagi.');
                return;
            }

            const response = await fetch(route('pos.cashier.quick-customer'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    customer_discount_id: formData.customer_discount_id && formData.customer_discount_id !== '0' ? formData.customer_discount_id : null,
                }),
            });

            if (response.status === 419) {
                toast.error('Token keamanan tidak valid. Refresh halaman dan coba lagi.');
                console.error('CSRF token mismatch (419)');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success('Pelanggan berhasil ditambahkan');
                onSuccess(result.customer);
                handleClose();
            } else {
                toast.error(result.message || 'Gagal menambahkan pelanggan');
            }
        } catch (error) {
            console.error('Add customer error:', error);
            toast.error('Terjadi kesalahan saat menambahkan pelanggan');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            customer_discount_id: '',
        });
        onClose();
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-white border-gray-200">
                <DialogHeader className="border-b border-gray-200 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-gray-900">
                        <UserPlus className="h-5 w-5" />
                        Tambah Pelanggan Baru
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Tambahkan pelanggan baru dengan cepat untuk transaksi ini
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                            Nama Pelanggan *
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Masukkan nama pelanggan"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                            Nomor Telepon
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="Masukkan nomor telepon"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Masukkan email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* Customer Discount Field */}
                    <div className="space-y-2">
                        <Label htmlFor="customer_discount" className="text-sm font-medium text-gray-900">
                            Jenis Member
                        </Label>
                        <Select
                            value={formData.customer_discount_id || "no-discount"}
                            onValueChange={(value) => handleInputChange('customer_discount_id', value === "no-discount" ? "" : value)}
                        >
                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Pilih jenis member (opsional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="no-discount" className="text-gray-900 hover:bg-gray-50">
                                    Tidak ada member
                                </SelectItem>
                                {customerDiscounts.map((discount) => (
                                    <SelectItem 
                                        key={discount.id} 
                                        value={discount.id.toString()}
                                        className="text-gray-900 hover:bg-gray-50"
                                    >
                                        <div className="flex flex-col">
                                            <div className="font-medium">{discount.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Diskon {discount.discount_percentage}% • 
                                                Min. Rp {discount.minimum_purchase.toLocaleString('id-ID')}
                                                {discount.maximum_discount && 
                                                    ` • Max. Rp ${discount.maximum_discount.toLocaleString('id-ID')}`
                                                }
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Info box for selected discount */}
                    {formData.customer_discount_id && formData.customer_discount_id !== '0' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            {(() => {
                                const selectedDiscount = customerDiscounts.find(d => d.id.toString() === formData.customer_discount_id);
                                if (!selectedDiscount) return null;
                                
                                return (
                                    <div className="text-sm">
                                        <div className="font-medium text-blue-900 mb-1">
                                            {selectedDiscount.name}
                                        </div>
                                        <div className="text-blue-700">
                                            • Diskon {selectedDiscount.discount_percentage}% untuk setiap pembelian
                                        </div>
                                        <div className="text-blue-700">
                                            • Minimum pembelian Rp {selectedDiscount.minimum_purchase.toLocaleString('id-ID')}
                                        </div>
                                        {selectedDiscount.maximum_discount && (
                                            <div className="text-blue-700">
                                                • Maksimal diskon Rp {selectedDiscount.maximum_discount.toLocaleString('id-ID')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </form>

                <DialogFooter className="border-t border-gray-200 pt-4">
                    <Button 
                        type="button"
                        variant="outline" 
                        onClick={handleClose}
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </Button>
                    <Button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !formData.name.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Pelanggan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
