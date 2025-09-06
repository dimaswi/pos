import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Users, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { useState, useMemo } from 'react';

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

interface Props {
    allUsers: UserData[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Data',
        href: '/master-data',
    },
    {
        title: 'Stores',
        href: '/master-data/stores',
    },
    {
        title: 'Create',
        href: '/master-data/stores/create',
    },
];

export default function StoreCreate({ allUsers }: Props) {
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [userSearch, setUserSearch] = useState('');
    
    // Apply search filter to all users
    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(user => 
                user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                user.nip.toLowerCase().includes(userSearch.toLowerCase()) ||
                user.role?.name?.toLowerCase().includes(userSearch.toLowerCase())
            );
    }, [allUsers, userSearch]);
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        is_active: true as boolean,
        user_ids: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = {
            ...data,
            user_ids: selectedUsers
        };
        
        router.post('/master-data/stores', formData);
    };

    const handleUserSelection = (userId: number, checked: boolean) => {
        if (checked) {
            setSelectedUsers([...selectedUsers, userId]);
        } else {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Toko" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit('/master-data/stores')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Tambah Toko</CardTitle>
                            <CardDescription>
                                Tambahkan lokasi toko baru ke sistem Anda
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Store Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Toko *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama toko"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Store Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Toko *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode toko"
                                        className={errors.code ? 'border-destructive' : ''}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-destructive">{errors.code}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telepon</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="Masukkan nomor telepon"
                                        className={errors.phone ? 'border-destructive' : ''}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive">{errors.phone}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Masukkan alamat email"
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('address', e.target.value)}
                                    placeholder="Masukkan alamat toko"
                                    className={errors.address ? 'border-destructive' : ''}
                                    rows={3}
                                />
                                {errors.address && (
                                    <p className="text-sm text-destructive">{errors.address}</p>
                                )}
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>

                            {/* Assign Users */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        <Label className="text-base font-medium">Assign Karyawan ({selectedUsers.length})</Label>
                                    </div>
                                    {selectedUsers.length > 0 && (
                                        <Badge variant="secondary">{selectedUsers.length} terpilih</Badge>
                                    )}
                                </div>
                                
                                {allUsers.filter(user => user.role?.name?.toLowerCase() !== 'admin').length > 0 ? (
                                    <div className="border rounded-lg">
                                        {/* Search */}
                                        <div className="p-4 border-b">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="Cari karyawan berdasarkan nama, NIP, atau role..."
                                                    value={userSearch}
                                                    onChange={(e) => setUserSearch(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Table or No Results */}
                                        {filteredUsers.length > 0 ? (
                                            <div className="max-h-80 overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-12">
                                                                <Checkbox
                                                                    checked={filteredUsers.length > 0 && filteredUsers.every(user => selectedUsers.includes(user.id))}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSelectedUsers([...new Set([...selectedUsers, ...filteredUsers.map(u => u.id)])]);
                                                                        } else {
                                                                            setSelectedUsers(selectedUsers.filter(id => !filteredUsers.some(u => u.id === id)));
                                                                        }
                                                                    }}
                                                                />
                                                            </TableHead>
                                                            <TableHead>Nama</TableHead>
                                                            <TableHead>NIP</TableHead>
                                                            <TableHead>Role</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredUsers.map((user) => (
                                                            <TableRow key={user.id}>
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={selectedUsers.includes(user.id)}
                                                                        onCheckedChange={(checked) => 
                                                                            handleUserSelection(user.id, checked as boolean)
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                                <TableCell>{user.nip}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {user.role?.name || 'No Role'}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-500">
                                                    {userSearch 
                                                        ? `Tidak ada karyawan yang sesuai dengan "${userSearch}"` 
                                                        : 'Tidak ada karyawan tersedia'
                                                    }
                                                </p>
                                                {userSearch && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => setUserSearch('')}
                                                        className="mt-2"
                                                    >
                                                        Clear search
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border rounded-lg border-dashed">
                                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Tidak ada karyawan tersedia untuk di-assign</p>
                                        <p className="text-sm text-gray-400">User dengan role admin tidak dapat di-assign ke toko</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Simpan Toko
                                </Button>
                                <Button 
                                    variant="outline" 
                                    type="button"
                                    onClick={() => router.visit('/master-data/stores')}
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
        </AppLayout>
    );
}
