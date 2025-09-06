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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['cash', 'card', 'digital_wallet', 'bank_transfer', 'credit', 'other'])->default('cash');
            $table->decimal('fee_percentage', 5, 2)->default(0); // Fee percentage
            $table->decimal('fee_fixed', 10, 2)->default(0); // Fixed fee amount
            $table->boolean('requires_reference')->default(false);
            $table->boolean('requires_authorization')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('settings')->nullable(); // Additional settings (account numbers, etc.)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index(['code']);
            $table->index(['type']);
            $table->index(['is_active']);
            $table->index(['sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
