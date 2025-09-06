# SISTEM POINT OF SALES MULTI TOKO

## 1. Tujuan Sistem
Buatkan saya sistem point of sales multi toko yang komprehensif dengan manajemen terpusat dan operasional per toko yang terpisah.

## 2. Fitur Utama Sistem

### A. Manajemen Master Data (✅ COMPLETED)
- **Manajemen Toko**: Kelola data toko (nama, alamat, kontak, zona waktu, mata uang) (✅ Done)
- **Manajemen Kategori**: Kategorisasi produk untuk memudahkan pengelolaan (✅ Done)
- **Manajemen Produk**: Database produk terpusat dengan informasi lengkap (barcode, harga, deskripsi) (✅ Done)
- **Manajemen Supplier**: Data pemasok untuk proses procurement (✅ Done)
- **Manajemen Customer**: Database pelanggan dengan sistem member/loyalty (✅ Done)

### B. Manajemen Inventaris (✅ COMPLETED)
- **Stok per Toko**: Kelola stok barang untuk setiap toko secara terpisah (✅ Done)
- **Transfer Stok**: Transfer barang antar toko (✅ Done)
- **Adjustment Stok**: Penyesuaian stok karena rusak/hilang/expired (✅ Done)
- **Purchase Order**: Sistem pembelian dari supplier (✅ Done)
- **Receiving**: Penerimaan barang dengan validasi (✅ Done)
- **Minimum Stock Alert**: Notifikasi stok minimum per toko (✅ Done)

### C. Manajemen Penjualan (✅ COMPLETED)
- **Transaksi Penjualan**: Pencatatan transaksi per toko (✅ Done)
- **Payment Methods**: Multiple metode pembayaran (cash, card, digital wallet) (✅ Done)
- **Discount & Promotion**: Sistem diskon dan promosi (✅ Done)
- **Return & Refund**: Penanganan retur dan refund (✅ Done)
- **Layaway/Pre-order**: Sistem booking/pre-order (❌ Terlewat)

### D. Point of Sale (POS)
- **Interface POS**: Antarmuka kasir yang user-friendly, dan sesuai dengan toko masing-masing tanpa harus memilih toko untuk melihat product (✅ Done)
- **Barcode Scanner**: Integrasi dengan barcode scanner (❌ Belum perlu)
- **Calculator**: Kalkulator terintegrasi untuk perhitungan (✅ Done)
- **Customer Display**: Tampilan untuk customer (❌ Belum perlu)
- **Cash Drawer Integration**: Integrasi dengan cash drawer (❌ Belum perlu)
- **Hotkeys**: Shortcut keyboard untuk efisiensi (✅ Done)

### E. Sistem Laporan & Analytics
- **Laporan Penjualan**: per toko, per periode, per produk, per kasir
- **Laporan Inventory**: stok movement, slow moving items, stock value
- **Laporan Keuangan**: daily closing, cash flow, profit/loss
- **Dashboard Analytics**: real-time overview dengan charts
- **Export Reports**: PDF, Excel, CSV format

### F. Sistem Printing & Receipt
- **Receipt Printing**: Struk belanja dengan template customizable
- **Thermal Printer**: Support untuk thermal printer
- **Kitchen Printer**: Untuk F&B business (jika applicable)
- **Label Printing**: Cetak label harga/barcode
- **Report Printing**: Cetak laporan dalam berbagai format

### G. Multi-User & Access Control
- **Role-based Access**: Akses berdasarkan role (Super Admin, Store Manager, Cashier)
- **User per Store**: Assign user ke toko tertentu
- **Audit Trail**: Log aktivitas user untuk security
- **Shift Management**: Manajemen shift kasir dengan opening/closing balance

## 3. Yang Sudah Ada pada Starter-Kit
- **Manajemen Pengguna**: untuk mengelola pengguna dan hak akses
- **Manajemen Role & Permission**: sistem permission yang granular
- **Manajemen Setting**: untuk mengelola pengaturan aplikasi (logo, favicon, nama app)

## 4. Teknologi & Arsitektur
- **Backend**: Laravel dengan Inertia.js
- **Frontend**: React.js dengan TypeScript
- **UI Framework**: Shadcn/UI untuk konsistensi tampilan
- **Database**: MySQL/PostgreSQL
- **Layout**: Menggunakan layout existing dari `resources/js/pages/master/user/index`
- **API Integration**: RESTful API untuk external integrations
- **Real-time**: WebSocket untuk real-time updates (optional)

## 5. Database Schema (Overview)
```
- stores (toko)
- categories (kategori produk)
- products (produk)
- suppliers (pemasok)
- customers (pelanggan)
- inventory (stok per toko)
- sales_transactions (transaksi penjualan)
- sale_items (detail item penjualan)
- purchase_orders (pesanan pembelian)
- stock_movements (pergerakan stok)
- payments (pembayaran)
- discounts (diskon)
- user_stores (relasi user-toko)
```

## 6. Prioritas Development
1. **Phase 1**: Master Data (Toko, Kategori, Produk, Supplier)
2. **Phase 2**: Inventory Management (Stok, Purchase, Transfer)
3. **Phase 3**: POS System & Sales Transaction
4. **Phase 4**: Reporting & Analytics
5. **Phase 5**: Advanced Features (Loyalty, Promotion, etc.)

## 7. Non-Functional Requirements
- **Performance**: Response time < 2 detik untuk transaksi POS
- **Scalability**: Support multiple stores dan concurrent users
- **Security**: Encryption untuk data sensitif, secure session management
- **Backup**: Automated backup dengan retention policy
- **Offline Capability**: POS dapat berfungsi offline (optional)
- **Mobile Responsive**: Dapat diakses via mobile device
- **CamelCase**: Menggunakan penamaan CamelCase untuk direktori, file, variable, dan fungsi