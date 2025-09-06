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
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity')->default(0);
            $table->integer('minimum_stock')->default(0);
            $table->integer('maximum_stock')->nullable();
            $table->decimal('average_cost', 15, 2)->default(0);
            $table->decimal('last_cost', 15, 2)->default(0);
            $table->string('location')->nullable(); // rak/lokasi penyimpanan
            $table->date('last_restock_date')->nullable();
            $table->timestamps();
            
            // Index untuk performa
            $table->unique(['store_id', 'product_id']);
            $table->index(['store_id', 'quantity']);
            $table->index(['product_id', 'quantity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
