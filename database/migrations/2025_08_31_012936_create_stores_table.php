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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Kode toko (STR001, STR002)
            $table->string('name'); // Nama toko
            $table->text('description')->nullable(); // Deskripsi toko
            $table->text('address')->nullable(); // Alamat lengkap
            $table->string('city')->nullable(); // Kota
            $table->string('province')->nullable(); // Provinsi
            $table->string('postal_code')->nullable(); // Kode pos
            $table->string('phone')->nullable(); // Nomor telepon
            $table->string('email')->nullable(); // Email toko
            $table->string('manager_name')->nullable(); // Nama manager
            $table->string('timezone')->default('Asia/Jakarta'); // Zona waktu
            $table->string('currency')->default('IDR'); // Mata uang
            $table->decimal('tax_rate', 5, 2)->default(0); // Pajak (%)
            $table->boolean('is_active')->default(true); // Status aktif
            $table->json('business_hours')->nullable(); // Jam operasional
            $table->timestamps();
            
            $table->index(['is_active', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
