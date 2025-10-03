import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import PermissionGate from '@/components/permission-gate';

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function POSLayout({ children, title }: Props) {
    const { auth, store } = usePage().props as any;
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-screen flex flex-col bg-white text-gray-900">
            <Head title={title ? `${title} - POS System` : 'POS System'} />
            
            {/* POS Header */}
            <header className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-gray-900">POS System</h1>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="text-sm">
                            <div className="font-medium text-gray-900">
                                {store?.name || 'Unknown Store'} ({store?.code || ''})
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {currentTime.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 font-mono">
                            {currentTime.toLocaleTimeString('id-ID')}
                        </div>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="text-sm">
                            <div className="font-medium text-gray-900">
                                Kasir: {auth?.user?.name || 'Unknown'}
                            </div>
                        </div>
                        <PermissionGate permission="pos.view">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.post(route('pos.exit'))}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4 mr-1" />
                                Keluar POS
                            </Button>
                        </PermissionGate>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>

            {/* Toast Notifications */}
            <Toaster 
                position="top-right"
                theme="light"
                richColors
            />
        </div>
    );
}
