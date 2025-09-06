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
        Schema::table('sales_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_transactions', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('store_id')->constrained('customers')->onDelete('set null');
                $table->index(['customer_id']);
            }
            if (!Schema::hasColumn('sales_transactions', 'customer_discount_amount')) {
                $table->decimal('customer_discount_amount', 15, 2)->default(0)->after('discount_amount');
            }
            if (!Schema::hasColumn('sales_transactions', 'customer_discount_percentage')) {
                $table->decimal('customer_discount_percentage', 5, 2)->default(0)->after('customer_discount_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['customer_id', 'customer_discount_amount', 'customer_discount_percentage']);
        });
    }
};
