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
            // Remove unused columns
            $table->dropColumn(['city', 'province', 'postal_code', 'credit_limit', 'outstanding_balance', 'tax_number']);
            
            // Rename loyalty_points to total_points
            $table->renameColumn('loyalty_points', 'total_points');
            
            // Add missing columns
            $table->date('membership_date')->nullable()->after('customer_type');
            $table->decimal('total_spent', 15, 2)->default(0)->after('total_points');
            $table->integer('total_transactions')->default(0)->after('total_spent');
            $table->date('last_transaction_date')->nullable()->after('total_transactions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Add back removed columns
            $table->string('city')->nullable()->after('address');
            $table->string('province')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('province');
            $table->decimal('credit_limit', 15, 2)->default(0)->after('customer_type');
            $table->decimal('outstanding_balance', 15, 2)->default(0)->after('credit_limit');
            $table->string('tax_number')->nullable()->after('outstanding_balance');
            
            // Rename back
            $table->renameColumn('total_points', 'loyalty_points');
            
            // Remove added columns
            $table->dropColumn(['membership_date', 'total_spent', 'total_transactions', 'last_transaction_date']);
        });
    }
};
