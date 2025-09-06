<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'voided' to the enum values for sales_payments status
        DB::statement("ALTER TABLE sales_payments DROP CONSTRAINT sales_payments_status_check");
        DB::statement("ALTER TABLE sales_payments ADD CONSTRAINT sales_payments_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'voided'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'voided' from enum values
        DB::statement("ALTER TABLE sales_payments DROP CONSTRAINT sales_payments_status_check");
        DB::statement("ALTER TABLE sales_payments ADD CONSTRAINT sales_payments_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))");
    }
};
