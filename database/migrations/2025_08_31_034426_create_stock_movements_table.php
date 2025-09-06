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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['in', 'out', 'adjustment', 'transfer_in', 'transfer_out', 'sale', 'purchase', 'return']);
            $table->integer('quantity_before');
            $table->integer('quantity_change'); // bisa positif atau negatif
            $table->integer('quantity_after');
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->string('reference_type')->nullable(); // PurchaseOrder, Sale, StockTransfer, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('movement_date');
            $table->timestamps();
            
            $table->index(['store_id', 'product_id']);
            $table->index(['type', 'movement_date']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
