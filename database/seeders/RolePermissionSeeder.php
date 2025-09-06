<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // Store Management
            ['name' => 'store.view', 'display_name' => 'Lihat Store', 'description' => 'Dapat melihat daftar store', 'module' => 'Store Management'],
            ['name' => 'store.create', 'display_name' => 'Tambah Store', 'description' => 'Dapat menambah store baru', 'module' => 'Store Management'],
            ['name' => 'store.edit', 'display_name' => 'Edit Store', 'description' => 'Dapat mengedit data store', 'module' => 'Store Management'],
            ['name' => 'store.delete', 'display_name' => 'Hapus Store', 'description' => 'Dapat menghapus store', 'module' => 'Store Management'],

            // Category Management
            ['name' => 'category.view', 'display_name' => 'Lihat Kategori', 'description' => 'Dapat melihat daftar kategori', 'module' => 'Category Management'],
            ['name' => 'category.create', 'display_name' => 'Tambah Kategori', 'description' => 'Dapat menambah kategori baru', 'module' => 'Category Management'],
            ['name' => 'category.edit', 'display_name' => 'Edit Kategori', 'description' => 'Dapat mengedit data kategori', 'module' => 'Category Management'],
            ['name' => 'category.delete', 'display_name' => 'Hapus Kategori', 'description' => 'Dapat menghapus kategori', 'module' => 'Category Management'],

            // Product Management
            ['name' => 'product.view', 'display_name' => 'Lihat Produk', 'description' => 'Dapat melihat daftar produk', 'module' => 'Product Management'],
            ['name' => 'product.create', 'display_name' => 'Tambah Produk', 'description' => 'Dapat menambah produk baru', 'module' => 'Product Management'],
            ['name' => 'product.edit', 'display_name' => 'Edit Produk', 'description' => 'Dapat mengedit data produk', 'module' => 'Product Management'],
            ['name' => 'product.delete', 'display_name' => 'Hapus Produk', 'description' => 'Dapat menghapus produk', 'module' => 'Product Management'],

            // Supplier Management
            ['name' => 'supplier.view', 'display_name' => 'Lihat Supplier', 'description' => 'Dapat melihat daftar supplier', 'module' => 'Supplier Management'],
            ['name' => 'supplier.create', 'display_name' => 'Tambah Supplier', 'description' => 'Dapat menambah supplier baru', 'module' => 'Supplier Management'],
            ['name' => 'supplier.edit', 'display_name' => 'Edit Supplier', 'description' => 'Dapat mengedit data supplier', 'module' => 'Supplier Management'],
            ['name' => 'supplier.delete', 'display_name' => 'Hapus Supplier', 'description' => 'Dapat menghapus supplier', 'module' => 'Supplier Management'],

            // Customer Management
            ['name' => 'customer.view', 'display_name' => 'Lihat Customer', 'description' => 'Dapat melihat daftar customer', 'module' => 'Customer Management'],
            ['name' => 'customer.create', 'display_name' => 'Tambah Customer', 'description' => 'Dapat menambah customer baru', 'module' => 'Customer Management'],
            ['name' => 'customer.edit', 'display_name' => 'Edit Customer', 'description' => 'Dapat mengedit data customer', 'module' => 'Customer Management'],
            ['name' => 'customer.delete', 'display_name' => 'Hapus Customer', 'description' => 'Dapat menghapus customer', 'module' => 'Customer Management'],

            // Customer Discount Management
            ['name' => 'customer-discount.view', 'display_name' => 'Lihat Diskon Customer', 'description' => 'Dapat melihat daftar diskon customer', 'module' => 'Customer Discount Management'],
            ['name' => 'customer-discount.create', 'display_name' => 'Tambah Diskon Customer', 'description' => 'Dapat menambah diskon customer baru', 'module' => 'Customer Discount Management'],
            ['name' => 'customer-discount.edit', 'display_name' => 'Edit Diskon Customer', 'description' => 'Dapat mengedit data diskon customer', 'module' => 'Customer Discount Management'],
            ['name' => 'customer-discount.delete', 'display_name' => 'Hapus Diskon Customer', 'description' => 'Dapat menghapus diskon customer', 'module' => 'Customer Discount Management'],

            // Discount Management
            ['name' => 'discount.view', 'display_name' => 'Lihat Diskon', 'description' => 'Dapat melihat daftar diskon', 'module' => 'Discount Management'],
            ['name' => 'discount.create', 'display_name' => 'Tambah Diskon', 'description' => 'Dapat menambah diskon baru', 'module' => 'Discount Management'],
            ['name' => 'discount.edit', 'display_name' => 'Edit Diskon', 'description' => 'Dapat mengedit data diskon', 'module' => 'Discount Management'],
            ['name' => 'discount.delete', 'display_name' => 'Hapus Diskon', 'description' => 'Dapat menghapus diskon', 'module' => 'Discount Management'],

            // Payment Method Management
            ['name' => 'payment-method.view', 'display_name' => 'Lihat Metode Pembayaran', 'description' => 'Dapat melihat daftar metode pembayaran', 'module' => 'Payment Method Management'],
            ['name' => 'payment-method.create', 'display_name' => 'Tambah Metode Pembayaran', 'description' => 'Dapat menambah metode pembayaran baru', 'module' => 'Payment Method Management'],
            ['name' => 'payment-method.edit', 'display_name' => 'Edit Metode Pembayaran', 'description' => 'Dapat mengedit data metode pembayaran', 'module' => 'Payment Method Management'],
            ['name' => 'payment-method.delete', 'display_name' => 'Hapus Metode Pembayaran', 'description' => 'Dapat menghapus metode pembayaran', 'module' => 'Payment Method Management'],

            // Return Management
            ['name' => 'return.view', 'display_name' => 'Lihat Retur', 'description' => 'Dapat melihat daftar retur', 'module' => 'Return Management'],
            ['name' => 'return.create', 'display_name' => 'Tambah Retur', 'description' => 'Dapat menambah retur baru', 'module' => 'Return Management'],
            ['name' => 'return.edit', 'display_name' => 'Edit Retur', 'description' => 'Dapat mengedit data retur', 'module' => 'Return Management'],
            ['name' => 'return.delete', 'display_name' => 'Hapus Retur', 'description' => 'Dapat menghapus retur', 'module' => 'Return Management'],
            ['name' => 'return.approve', 'display_name' => 'Setujui Retur', 'description' => 'Dapat menyetujui permintaan retur', 'module' => 'Return Management'],
            ['name' => 'return.reject', 'display_name' => 'Tolak Retur', 'description' => 'Dapat menolak permintaan retur', 'module' => 'Return Management'],

            // Inventory Management
            ['name' => 'inventory.view', 'display_name' => 'Lihat Inventory', 'description' => 'Dapat melihat daftar inventory', 'module' => 'Inventory Management'],
            ['name' => 'inventory.create', 'display_name' => 'Tambah Inventory', 'description' => 'Dapat menambah inventory baru', 'module' => 'Inventory Management'],
            ['name' => 'inventory.edit', 'display_name' => 'Edit Inventory', 'description' => 'Dapat mengedit data inventory', 'module' => 'Inventory Management'],
            ['name' => 'inventory.delete', 'display_name' => 'Hapus Inventory', 'description' => 'Dapat menghapus inventory', 'module' => 'Inventory Management'],

            // Purchase Order Management
            ['name' => 'purchase-order.view', 'display_name' => 'Lihat Purchase Order', 'description' => 'Dapat melihat daftar purchase order', 'module' => 'Purchase Order Management'],
            ['name' => 'purchase-order.create', 'display_name' => 'Tambah Purchase Order', 'description' => 'Dapat menambah purchase order baru', 'module' => 'Purchase Order Management'],
            ['name' => 'purchase-order.edit', 'display_name' => 'Edit Purchase Order', 'description' => 'Dapat mengedit data purchase order', 'module' => 'Purchase Order Management'],
            ['name' => 'purchase-order.delete', 'display_name' => 'Hapus Purchase Order', 'description' => 'Dapat menghapus purchase order', 'module' => 'Purchase Order Management'],
            ['name' => 'purchase-order.approve', 'display_name' => 'Setujui Purchase Order', 'description' => 'Dapat menyetujui purchase order', 'module' => 'Purchase Order Management'],
            ['name' => 'purchase-order.reject', 'display_name' => 'Tolak Purchase Order', 'description' => 'Dapat menolak purchase order', 'module' => 'Purchase Order Management'],

            // Stock Transfer Management
            ['name' => 'stock-transfer.view', 'display_name' => 'Lihat Stock Transfer', 'description' => 'Dapat melihat daftar stock transfer', 'module' => 'Stock Transfer Management'],
            ['name' => 'stock-transfer.create', 'display_name' => 'Tambah Stock Transfer', 'description' => 'Dapat menambah stock transfer baru', 'module' => 'Stock Transfer Management'],
            ['name' => 'stock-transfer.edit', 'display_name' => 'Edit Stock Transfer', 'description' => 'Dapat mengedit data stock transfer', 'module' => 'Stock Transfer Management'],
            ['name' => 'stock-transfer.delete', 'display_name' => 'Hapus Stock Transfer', 'description' => 'Dapat menghapus stock transfer', 'module' => 'Stock Transfer Management'],
            ['name' => 'stock-transfer.approve', 'display_name' => 'Setujui Stock Transfer', 'description' => 'Dapat menyetujui stock transfer', 'module' => 'Stock Transfer Management'],
            ['name' => 'stock-transfer.reject', 'display_name' => 'Tolak Stock Transfer', 'description' => 'Dapat menolak stock transfer', 'module' => 'Stock Transfer Management'],

            // Stock Adjustment Management
            ['name' => 'stock-adjustment.view', 'display_name' => 'Lihat Stock Adjustment', 'description' => 'Dapat melihat daftar stock adjustment', 'module' => 'Stock Adjustment Management'],
            ['name' => 'stock-adjustment.create', 'display_name' => 'Tambah Stock Adjustment', 'description' => 'Dapat menambah stock adjustment baru', 'module' => 'Stock Adjustment Management'],
            ['name' => 'stock-adjustment.edit', 'display_name' => 'Edit Stock Adjustment', 'description' => 'Dapat mengedit data stock adjustment', 'module' => 'Stock Adjustment Management'],
            ['name' => 'stock-adjustment.delete', 'display_name' => 'Hapus Stock Adjustment', 'description' => 'Dapat menghapus stock adjustment', 'module' => 'Stock Adjustment Management'],
            ['name' => 'stock-adjustment.approve', 'display_name' => 'Setujui Stock Adjustment', 'description' => 'Dapat menyetujui stock adjustment', 'module' => 'Stock Adjustment Management'],
            ['name' => 'stock-adjustment.reject', 'display_name' => 'Tolak Stock Adjustment', 'description' => 'Dapat menolak stock adjustment', 'module' => 'Stock Adjustment Management'],

            // Sales Management
            ['name' => 'sales.view', 'display_name' => 'Lihat Penjualan', 'description' => 'Dapat melihat data penjualan', 'module' => 'Sales Management'],
            ['name' => 'sales.create', 'display_name' => 'Tambah Penjualan', 'description' => 'Dapat menambah transaksi penjualan', 'module' => 'Sales Management'],
            ['name' => 'sales.edit', 'display_name' => 'Edit Penjualan', 'description' => 'Dapat mengedit transaksi penjualan', 'module' => 'Sales Management'],
            ['name' => 'sales.delete', 'display_name' => 'Hapus Penjualan', 'description' => 'Dapat menghapus transaksi penjualan', 'module' => 'Sales Management'],
            ['name' => 'sales.void', 'display_name' => 'Void Penjualan', 'description' => 'Dapat membatalkan transaksi penjualan', 'module' => 'Sales Management'],
            ['name' => 'sales.index', 'display_name' => 'Index Penjualan', 'description' => 'Dapat mengakses halaman daftar penjualan', 'module' => 'Sales Management'],
            ['name' => 'sales.print', 'display_name' => 'Cetak Struk', 'description' => 'Dapat mencetak struk penjualan', 'module' => 'Sales Management'],

            // POS Management
            ['name' => 'pos.view', 'display_name' => 'Akses POS', 'description' => 'Dapat mengakses point of sale', 'module' => 'POS Management'],
            ['name' => 'pos.create', 'display_name' => 'Transaksi POS', 'description' => 'Dapat melakukan transaksi di POS', 'module' => 'POS Management'],

            // User Management
            ['name' => 'user.view', 'display_name' => 'Lihat User', 'description' => 'Dapat melihat daftar user', 'module' => 'User Management'],
            ['name' => 'user.create', 'display_name' => 'Tambah User', 'description' => 'Dapat menambah user baru', 'module' => 'User Management'],
            ['name' => 'user.edit', 'display_name' => 'Edit User', 'description' => 'Dapat mengedit data user', 'module' => 'User Management'],
            ['name' => 'user.delete', 'display_name' => 'Hapus User', 'description' => 'Dapat menghapus user', 'module' => 'User Management'],
            
            // Role Management
            ['name' => 'role.view', 'display_name' => 'Lihat Role', 'description' => 'Dapat melihat daftar role', 'module' => 'Role Management'],
            ['name' => 'role.create', 'display_name' => 'Tambah Role', 'description' => 'Dapat menambah role baru', 'module' => 'Role Management'],
            ['name' => 'role.edit', 'display_name' => 'Edit Role', 'description' => 'Dapat mengedit role', 'module' => 'Role Management'],
            ['name' => 'role.delete', 'display_name' => 'Hapus Role', 'description' => 'Dapat menghapus role', 'module' => 'Role Management'],
            
            // Permission Management
            ['name' => 'permission.view', 'display_name' => 'Lihat Permission', 'description' => 'Dapat melihat daftar permission', 'module' => 'Permission Management'],
            ['name' => 'permission.create', 'display_name' => 'Tambah Permission', 'description' => 'Dapat menambah permission baru', 'module' => 'Permission Management'],
            ['name' => 'permission.edit', 'display_name' => 'Edit Permission', 'description' => 'Dapat mengedit permission', 'module' => 'Permission Management'],
            ['name' => 'permission.delete', 'display_name' => 'Hapus Permission', 'description' => 'Dapat menghapus permission', 'module' => 'Permission Management'],
            
            // Dashboard
            ['name' => 'dashboard.view', 'display_name' => 'Lihat Dashboard', 'description' => 'Dapat mengakses dashboard', 'module' => 'Dashboard'],
            
            // Settings
            ['name' => 'settings.view', 'display_name' => 'Lihat Settings', 'description' => 'Dapat melihat pengaturan', 'module' => 'Settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'description' => 'Dapat mengedit pengaturan', 'module' => 'Settings'],

            // Reports Management
            ['name' => 'reports.view', 'display_name' => 'Lihat Laporan', 'description' => 'Dapat melihat laporan', 'module' => 'Reports Management'],
            ['name' => 'reports.export', 'display_name' => 'Export Laporan', 'description' => 'Dapat mengexport laporan', 'module' => 'Reports Management'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'display_name' => 'Administrator',
                'description' => 'Administrator dengan akses penuh ke semua fitur sistem'
            ]
        );

        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));
    }
}
