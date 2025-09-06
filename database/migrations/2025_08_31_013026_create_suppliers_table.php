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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Kode supplier (SUP001, SUP002)
            $table->string('name'); // Nama supplier
            $table->string('company_name')->nullable(); // Nama perusahaan
            $table->text('address')->nullable(); // Alamat
            $table->string('city')->nullable(); // Kota
            $table->string('province')->nullable(); // Provinsi
            $table->string('postal_code')->nullable(); // Kode pos
            $table->string('phone')->nullable(); // Telepon
            $table->string('email')->nullable(); // Email
            $table->string('contact_person')->nullable(); // Nama kontak person
            $table->string('tax_number')->nullable(); // NPWP
            $table->enum('payment_term', ['cash', 'credit_7', 'credit_14', 'credit_30', 'credit_60'])->default('cash'); // Termin pembayaran
            $table->decimal('credit_limit', 15, 2)->default(0); // Limit kredit
            $table->text('notes')->nullable(); // Catatan
            $table->boolean('is_active')->default(true); // Status aktif
            $table->timestamps();
            
            $table->index(['is_active', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
