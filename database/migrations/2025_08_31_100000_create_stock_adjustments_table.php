<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique();
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['increase', 'decrease']); // Tambah atau kurangi stok
            $table->enum('reason', ['damaged', 'expired', 'lost', 'found', 'correction', 'other']);
            $table->date('adjustment_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['draft', 'approved', 'rejected'])->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->decimal('total_value_impact', 15, 2)->default(0); // Impact nilai stok
            $table->timestamps();

            $table->index(['store_id', 'adjustment_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
