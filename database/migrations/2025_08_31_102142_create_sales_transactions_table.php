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
        Schema::create('sales_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number', 100)->unique();
            $table->string('reference_number', 100)->nullable();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Cashier
            $table->datetime('transaction_date');
            $table->decimal('subtotal_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('change_amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'completed', 'cancelled', 'refunded', 'voided'])->default('pending');
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'overpaid'])->default('pending');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable(); // Additional data (receipt data, etc.)
            $table->timestamps();
            
            // Indexes
            $table->index(['transaction_number']);
            $table->index(['store_id', 'transaction_date']);
            $table->index(['customer_id']);
            $table->index(['user_id']);
            $table->index(['status']);
            $table->index(['payment_status']);
            $table->index(['transaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_transactions');
    }
};
