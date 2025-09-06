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
        Schema::table('stock_transfers', function (Blueprint $table) {
            // Drop old columns
            $table->dropForeign(['product_id']);
            $table->dropColumn([
                'product_id',
                'requested_by',
                'sent_by',
                'quantity_requested',
                'quantity_sent',
                'quantity_received',
                'rejection_reason',
                'request_date',
                'approved_date',
                'sent_date',
                'received_date'
            ]);
            
            // Add new columns
            $table->date('transfer_date')->after('to_store_id');
            $table->decimal('total_value', 15, 2)->default(0)->after('notes');
            $table->foreignId('created_by')->after('total_value')->constrained('users')->onDelete('cascade');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->timestamp('shipped_at')->nullable()->after('approved_at');
            $table->timestamp('received_at')->nullable()->after('shipped_at');
            
            // Update status enum
            $table->dropColumn('status');
        });
        
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->enum('status', ['draft', 'pending', 'in_transit', 'completed', 'cancelled'])
                ->default('draft')
                ->after('transfer_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            // Add back old columns
            $table->foreignId('product_id')->after('to_store_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('requested_by')->after('product_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('sent_by')->nullable()->after('approved_by')->constrained('users')->onDelete('set null');
            $table->integer('quantity_requested')->after('sent_by');
            $table->integer('quantity_sent')->nullable()->after('quantity_requested');
            $table->integer('quantity_received')->nullable()->after('quantity_sent');
            $table->text('rejection_reason')->nullable()->after('notes');
            $table->date('request_date')->after('rejection_reason');
            $table->date('approved_date')->nullable()->after('request_date');
            $table->date('sent_date')->nullable()->after('approved_date');
            $table->date('received_date')->nullable()->after('sent_date');
            
            // Drop new columns
            $table->dropForeign(['created_by']);
            $table->dropColumn([
                'transfer_date',
                'total_value',
                'created_by',
                'approved_at',
                'shipped_at',
                'received_at'
            ]);
            
            // Update status enum back
            $table->dropColumn('status');
        });
        
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'])
                ->default('pending')
                ->after('quantity_received');
        });
    }
};
