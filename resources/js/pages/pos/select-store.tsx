import React, { useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

interface Store {
    id: number;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
}

interface SelectStoreProps {
    stores: Store[];
    hasStores?: boolean;
}

export default function SelectStore({ stores, hasStores = true }: SelectStoreProps) {
    // Show toast if user is redirected from POS without store
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const fromPOS = urlParams.get('from');
        const reason = urlParams.get('reason');
        const message = urlParams.get('message');
        
        if (fromPOS === 'pos') {
            if (reason === 'access_changed') {
                toast.warning('Akses Toko Berubah', {
                    description: 'Akses Anda ke toko sebelumnya telah berubah. Silakan pilih toko yang tersedia.',
                    duration: 4000
                });
            } else {
                toast.info('Pilih Toko Terlebih Dahulu', {
                    description: 'Anda perlu memilih toko sebelum dapat mengakses POS.',
                    duration: 3000
                });
            }
        } else if (fromPOS === 'logout' && message === 'reset_success') {
            toast.success('Keluar dari POS', {
                description: 'Session toko telah di-reset. Anda dapat memilih toko lain.',
                duration: 3000
            });
        }
        
        // Show toast for no store access
        if (!hasStores || stores.length === 0) {
            toast.error('Akses POS Ditolak', {
                description: 'Anda belum di-assign ke toko manapun. Silakan hubungi administrator untuk mendapatkan akses ke toko.',
                duration: 5000
            });
        }
        
        // Clean URL after showing toast
        if (fromPOS) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [hasStores, stores]);

    const handleSelectStore = (storeId: number) => {
        const selectedStore = stores.find(store => store.id === storeId);
        
        router.post(route('pos.set-store'), {
            store_id: storeId
        }, {
            onStart: () => {
                toast.loading('Mengatur toko...', {
                    id: 'selecting-store'
                });
            }, 
            onSuccess: () => {
                toast.success('Toko Berhasil Dipilih', {
                    id: 'selecting-store',
                    description: `Anda sekarang terhubung ke toko: ${selectedStore?.name}`,
                    duration: 2000
                });
            },
            onError: (errors) => {
                console.error('Error selecting store:', errors);
                toast.error('Gagal Memilih Toko', {
                    id: 'selecting-store',
                    description: 'Terjadi kesalahan saat memilih toko. Silakan coba lagi.',
                    duration: 4000
                });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Head title="Pilih Toko - POS" />

            <div className="w-full max-w-4xl">

                {stores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <div 
                                key={store.id} 
                                onClick={() => handleSelectStore(store.id)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-blue-300 hover:-translate-y-1"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                        <Store className="h-6 w-6 text-white" />
                                    </div>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{store.name}</h3>
                                    <p className="text-sm font-medium text-blue-600 mb-3">Kode: {store.code}</p>
                                    
                                    <div className="space-y-2 text-sm text-gray-600">
                                        {store.address && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{store.address}</span>
                                            </div>
                                        )}
                                        {store.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span>{store.phone}</span>
                                            </div>
                                        )}
                                        {store.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="truncate">{store.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-6">
                                        <div className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-center group-hover:bg-blue-700 transition-colors">
                                            Pilih Toko Ini
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Akses POS Tidak Tersedia
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Anda belum di-assign ke toko manapun untuk menggunakan POS.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Silakan hubungi administrator sistem untuk mendapatkan akses ke toko yang diinginkan.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                                variant="outline"
                                onClick={() => router.get('/dashboard')}
                                className="min-w-[120px]"
                            >
                                Kembali ke Dashboard
                            </Button>
                            <Button 
                                variant="default"
                                onClick={() => window.location.reload()}
                                className="min-w-[120px]"
                            >
                                Refresh Halaman
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Toast Notifications */}
            <Toaster 
                position="top-right"
                theme="light"
                richColors
            />
        </div>
    );
}
