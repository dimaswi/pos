    import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import { Loader2, Upload } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import PermissionGate from "@/components/permission-gate";

interface Settings {
    app_name: string;
    app_logo: string;
    app_favicon: string;
}

interface Props {
    settings: Settings;
}

export default function SettingIndex({ settings }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string>(settings.app_logo);
    const [faviconPreview, setFaviconPreview] = useState<string>(settings.app_favicon);

    const { data, setData, processing, errors } = useForm({
        app_name: settings.app_name,
        app_logo: null as File | null,
        app_favicon: null as File | null,
    });

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: "Master", href: "#" },
        { title: "Pengaturan", href: route("web-settings.index") },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('app_name', data.app_name);
        formData.append('_method', 'PUT');
        
        if (data.app_logo) {
            formData.append('app_logo', data.app_logo);
        }
        
        if (data.app_favicon) {
            formData.append('app_favicon', data.app_favicon);
        }

        router.post(route('web-settings.update'), formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Pengaturan berhasil disimpan');
                setIsLoading(false);
                // Refresh the page to get updated settings
                router.reload({ only: ['settings'] });
            },
            onError: (errors) => {
                console.error('Upload errors:', errors);
                toast.error('Terjadi kesalahan saat menyimpan pengaturan');
                setIsLoading(false);
            },
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_logo', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_favicon', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setFaviconPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Pengaturan" />

            <div className="py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Aplikasi</CardTitle>
                        <CardDescription>
                            Kelola pengaturan umum aplikasi seperti nama dan logo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* App Name */}
                            <div className="space-y-2">
                                <Label htmlFor="app_name">Nama Aplikasi</Label>
                                <Input
                                    id="app_name"
                                    type="text"
                                    value={data.app_name}
                                    onChange={(e) => setData('app_name', e.target.value)}
                                    placeholder="Masukkan nama aplikasi"
                                    className={errors.app_name ? 'border-red-500' : ''}
                                />
                                {errors.app_name && (
                                    <p className="text-sm text-red-500">{errors.app_name}</p>
                                )}
                            </div>

                            {/* App Logo */}
                            <div className="space-y-2">
                                <Label htmlFor="app_logo">Logo Aplikasi</Label>
                                <div className="flex items-start space-x-4">
                                    {/* Current Logo Preview */}
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Upload className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Upload Input */}
                                    <div className="flex-1">
                                        <Input
                                            id="app_logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className={errors.app_logo ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Format: JPG, PNG, GIF, SVG. Maksimal 2MB.
                                        </p>
                                        {errors.app_logo && (
                                            <p className="text-sm text-red-500 mt-1">{errors.app_logo}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* App Favicon */}
                            <div className="space-y-2">
                                <Label htmlFor="app_favicon">Favicon Aplikasi</Label>
                                <div className="flex items-start space-x-4">
                                    {/* Current Favicon Preview */}
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                                            {faviconPreview ? (
                                                <img
                                                    src={faviconPreview}
                                                    alt="Favicon Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Upload className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Upload Input */}
                                    <div className="flex-1">
                                        <Input
                                            id="app_favicon"
                                            type="file"
                                            accept="image/*,.ico"
                                            onChange={handleFaviconChange}
                                            className={errors.app_favicon ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Format: ICO, PNG, JPG, GIF, SVG. Maksimal 1MB. Ukuran disarankan 32x32px.
                                        </p>
                                        {errors.app_favicon && (
                                            <p className="text-sm text-red-500 mt-1">{errors.app_favicon}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing || isLoading}>
                                    {(processing || isLoading) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Simpan Pengaturan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
