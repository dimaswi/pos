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
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->enum('type', ['percentage', 'fixed', 'buy_x_get_y']);
            $table->decimal('value', 10, 2);
            $table->foreignId('store_id')->nullable()->constrained()->onDelete('cascade');
            $table->text('description')->nullable();
            $table->decimal('minimum_amount', 15, 2)->nullable();
            $table->decimal('maximum_discount', 15, 2)->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_limit_per_customer')->nullable();
            $table->integer('usage_count')->default(0);
            $table->datetime('start_date');
            $table->datetime('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('apply_to_sale_items')->default(false);
            $table->integer('minimum_quantity')->nullable();
            $table->integer('get_quantity')->nullable();
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index(['store_id', 'is_active']);
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
