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
        Schema::table('customers', function (Blueprint $table) {
            // Add customer_discount_id column
            $table->foreignId('customer_discount_id')->nullable()->constrained('customer_discounts')->onDelete('set null');
            
            // Drop customer_type column if it exists
            if (Schema::hasColumn('customers', 'customer_type')) {
                $table->dropColumn('customer_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Drop foreign key and column
            $table->dropForeign(['customer_discount_id']);
            $table->dropColumn('customer_discount_id');
            
            // Re-add customer_type column
            $table->string('customer_type')->default('regular');
        });
    }
};
