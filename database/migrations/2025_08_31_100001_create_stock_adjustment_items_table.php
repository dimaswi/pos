<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_adjustment_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('current_quantity'); // Stok saat ini
            $table->integer('adjusted_quantity'); // Quantity yang disesuaikan (+/-)
            $table->integer('new_quantity'); // Stok setelah adjustment
            $table->decimal('unit_cost', 15, 2); // Cost per unit untuk kalkulasi value
            $table->decimal('total_value_impact', 15, 2); // Impact nilai untuk item ini
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['stock_adjustment_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_items');
    }
};
