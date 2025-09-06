import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Edit3, MapPin, Phone, Mail, Users, UserPlus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import { useState } from 'react';

interface UserData {
    id: number;
    name: string;
    nip: string;
    role_id: number;
    role: {
        id: number;
        name: string;
    };
}

interface StoreData {
    id: number;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    users?: UserData[];
}

interface Props {
    store: StoreData;
    allUsers: UserData[];
    [key: string]: any;
}

export default function StoreShow({ store, allUsers }: Props) {
    const { hasPermission } = usePermission();
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    const unassignedUsers = allUsers.filter(user => 
        !store.users?.some(storeUser => storeUser.id === user.id)
    );

    const handleAssignUsers = () => {
        if (selectedUsers.length === 0) return;

        router.post(route('master-data.stores.assign-users', store.id), {
            user_ids: selectedUsers
        }, {
            onSuccess: () => {
                setSelectedUsers([]);
                setIsAssignDialogOpen(false);
            }
        });
    };

    const handleRemoveUser = (userId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus karyawan ini dari toko?')) {
            router.delete(route('master-data.stores.remove-user', { store: store.id, user: userId }));
        }
    };

    const handleUserSelection = (userId: number, checked: boolean) => {
        if (checked) {
            setSelectedUsers([...selectedUsers, userId]);
        } else {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Master Data',
            href: '/master-data',
        },
        {
            title: 'Toko',
            href: '/master-data/stores',
        },
        {
            title: store.name,
            href: `/master-data/stores/${store.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Toko - ${store.name}`} />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.visit('/master-data/stores')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle>Detail Toko</CardTitle>
                                <CardDescription>
                                    Informasi lengkap toko {store.name}
                                </CardDescription>
                            </div>
                        </div>
                        
                        {hasPermission('store.edit') && (
                            <Button 
                                variant="outline"
                                onClick={() => router.visit(`/master-data/stores/${store.id}/edit`)}
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Toko
                            </Button>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Dasar</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nama Toko</label>
                                <p className="text-lg font-medium">{store.name}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Kode Toko</label>
                                <p className="text-lg font-mono">{store.code}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={store.is_active ? 'default' : 'secondary'}>
                                        {store.is_active ? 'Aktif' : 'Tidak Aktif'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Kontak</h3>
                        <div className="space-y-4">
                            {store.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                                        <p className="text-base">{store.phone}</p>
                                    </div>
                                </div>
                            )}
                            
                            {store.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                                        <p className="text-base">{store.email}</p>
                                    </div>
                                </div>
                            )}
                            
                            {store.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                                        <p className="text-base">{store.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Karyawan Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Karyawan ({store.users?.length || 0})
                            </h3>
                            {hasPermission('store.edit') && (
                                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <UserPlus className="h-4 w-4" />
                                            Assign Karyawan
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                        <DialogHeader className="space-y-3">
                                            <DialogTitle className="text-xl font-semibold">Assign Karyawan</DialogTitle>
                                            <DialogDescription className="text-gray-600">
                                                Pilih karyawan yang akan di-assign ke <span className="font-medium text-gray-900">{store.name}</span>
                                            </DialogDescription>
                                        </DialogHeader>
                                        
                                        <div className="space-y-4">
                                            {unassignedUsers.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Users className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">Semua karyawan sudah di-assign</p>
                                                    <p className="text-sm text-gray-400 mt-1">Tidak ada karyawan yang tersedia untuk di-assign ke toko ini</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1 max-h-80 overflow-y-auto">
                                                    {unassignedUsers.map((user) => (
                                                        <label 
                                                            key={user.id} 
                                                            className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            <Checkbox
                                                                checked={selectedUsers.includes(user.id)}
                                                                onCheckedChange={(checked) => 
                                                                    handleUserSelection(user.id, checked as boolean)
                                                                }
                                                                className="mr-3"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                                                                <p className="text-sm text-gray-500">NIP: {user.nip}</p>
                                                            </div>
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                {user.role?.name || 'No Role'}
                                                            </Badge>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {selectedUsers.length > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="text-sm text-blue-800">
                                                        <span className="font-medium">{selectedUsers.length}</span> karyawan akan di-assign ke toko ini
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <DialogFooter className="gap-2 pt-4">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => {
                                                    setIsAssignDialogOpen(false);
                                                    setSelectedUsers([]);
                                                }}
                                                className="flex-1"
                                            >
                                                Batal
                                            </Button>
                                            <Button 
                                                onClick={handleAssignUsers}
                                                disabled={selectedUsers.length === 0}
                                                className="flex-1"
                                            >
                                                Assign ({selectedUsers.length})
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {store.users && store.users.length > 0 ? (
                            <div className="space-y-2">
                                {store.users.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-sm">
                                                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">NIP: {user.nip}</p>
                                                <Badge variant="secondary" className="text-xs mt-1">
                                                    {user.role?.name || 'No Role'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {hasPermission('store.edit') && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleRemoveUser(user.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Karyawan</h3>
                                <p className="text-gray-500 mb-4">Toko ini belum memiliki karyawan yang di-assign</p>
                                {hasPermission('store.edit') && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => setIsAssignDialogOpen(true)}
                                        className="gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Assign Karyawan Pertama
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Informasi Sistem</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Dibuat Pada</label>
                                <p className="text-base">{new Date(store.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</label>
                                <p className="text-base">{new Date(store.updated_at).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
