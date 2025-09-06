<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique(); // SKU produk
            $table->string('barcode')->nullable()->unique(); // Barcode
            $table->string('name'); // Nama produk
            $table->text('description')->nullable(); // Deskripsi
            $table->unsignedBigInteger('category_id')->nullable(); // Kategori
            $table->unsignedBigInteger('supplier_id')->nullable(); // Supplier utama
            $table->string('unit')->default('pcs'); // Satuan (pcs, kg, liter, dll)
            $table->decimal('purchase_price', 15, 2)->default(0); // Harga beli
            $table->decimal('selling_price', 15, 2)->default(0); // Harga jual
            $table->decimal('minimum_price', 15, 2)->default(0); // Harga minimum
            $table->decimal('weight', 8, 2)->nullable(); // Berat (kg)
            $table->string('image')->nullable(); // Gambar produk
            $table->json('images')->nullable(); // Multiple images
            $table->boolean('is_track_stock')->default(true); // Track stok
            $table->integer('minimum_stock')->default(0); // Minimum stok
            $table->boolean('is_active')->default(true); // Status aktif
            $table->json('attributes')->nullable(); // Atribut tambahan (warna, ukuran, dll)
            $table->timestamps();
            
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
            $table->index(['is_active', 'category_id']);
            $table->index('sku');
            $table->index('barcode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
