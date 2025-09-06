import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Save, Key, Lock } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import PermissionGate from "@/components/permission-gate";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface Props {
    modules: string[];
    presetModule?: string;
}

export default function PermissionCreate({ modules, presetModule }: Props) {
    const { props } = usePage<SharedData>();
    const [useExistingModule, setUseExistingModule] = useState(!!presetModule && modules.includes(presetModule));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: <Lock className="h-4 w-4 mr-2" />, href: route("permissions.index") },
        { title: "Tambah Permission", href: route("permissions.create") },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        display_name: "",
        description: "",
        module: presetModule || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("permissions.store"), {
            onSuccess: () => {
                toast.success("Permission berhasil ditambahkan");
            },
            onError: () => {
                toast.error("Gagal menambahkan permission");
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Permission" />

            <div className="p-4">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <h1 className="text-xl font-semibold">Create New Permission</h1>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="bg-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Permission Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Contoh: users.create"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Gunakan format: module.action (contoh: users.create, posts.edit)
                                </p>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                                <Label htmlFor="display_name">
                                    Display Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="display_name"
                                    type="text"
                                    placeholder="Contoh: Buat User"
                                    value={data.display_name}
                                    onChange={(e) => setData("display_name", e.target.value)}
                                    className={errors.display_name ? "border-red-500" : ""}
                                />
                                {errors.display_name && (
                                    <p className="text-sm text-red-500">{errors.display_name}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Nama yang akan ditampilkan di interface
                                </p>
                            </div>

                            {/* Module */}
                            <div className="space-y-2">
                                <Label htmlFor="module">
                                    Module <span className="text-red-500">*</span>
                                </Label>
                                
                                {/* Toggle untuk memilih mode */}
                                <div className="flex items-center space-x-4 mb-3">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="moduleChoice"
                                            checked={!useExistingModule}
                                            onChange={() => {
                                                setUseExistingModule(false);
                                                setData("module", "");
                                            }}
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">Module Baru</span>
                                    </label>
                                    {modules.length > 0 && (
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="moduleChoice"
                                                checked={useExistingModule}
                                                onChange={() => {
                                                    setUseExistingModule(true);
                                                    setData("module", "");
                                                }}
                                                className="text-blue-600"
                                            />
                                            <span className="text-sm">Pilih Module Existing</span>
                                        </label>
                                    )}
                                </div>

                                {useExistingModule ? (
                                    /* Dropdown untuk module existing */
                                    <select
                                        id="module"
                                        value={data.module}
                                        onChange={(e) => setData("module", e.target.value)}
                                        className={`w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                            errors.module ? "border-red-500" : "border-gray-300"
                                        }`}
                                    >
                                        <option value="">Pilih module...</option>
                                        {modules.map((module) => (
                                            <option key={module} value={module}>
                                                {module}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    /* Input untuk module baru */
                                    <Input
                                        id="module"
                                        type="text"
                                        placeholder="Masukkan nama module baru (contoh: users, products, orders)"
                                        value={data.module}
                                        onChange={(e) => setData("module", e.target.value)}
                                        className={errors.module ? "border-red-500" : ""}
                                    />
                                )}
                                
                                {errors.module && (
                                    <p className="text-sm text-red-500">{errors.module}</p>
                                )}
                                
                                {!useExistingModule && (
                                    <p className="text-xs text-gray-500">
                                        Module akan digunakan untuk mengelompokkan permission. Gunakan nama yang singkat dan jelas.
                                    </p>
                                )}
                                
                                {modules.length > 0 && !useExistingModule && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">Module yang sudah ada:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {modules.map((module) => (
                                                <Badge
                                                    key={module}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-gray-100 text-xs"
                                                    onClick={() => setData("module", module)}
                                                >
                                                    {module}
                                                </Badge>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Klik badge di atas untuk menggunakan module yang sudah ada
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Deskripsi permission (opsional)"
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData("description", e.target.value)}
                                    rows={4}
                                    className={`w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.description ? "border-red-500" : "border-gray-300"}`}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Simpan Permission
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
