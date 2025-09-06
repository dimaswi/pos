<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'adjustment_number',
        'store_id',
        'created_by',
        'type',
        'reason',
        'adjustment_date',
        'notes',
        'status',
        'approved_by',
        'approved_at',
        'total_value_impact',
    ];

    protected $casts = [
        'adjustment_date' => 'date',
        'approved_at' => 'datetime',
        'total_value_impact' => 'decimal:2',
    ];

    // Relationships
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByReason($query, $reason)
    {
        return $query->where('reason', $reason);
    }

    // Helper methods
    public function canBeEdited(): bool
    {
        return $this->status === 'draft';
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'draft' && $this->items()->count() > 0;
    }

    public function canBeDeleted(): bool
    {
        return $this->status === 'draft';
    }

    public function calculateTotalValueImpact(): void
    {
        $this->total_value_impact = $this->items->sum('total_value_impact');
        $this->save();
    }

    public function getFormattedReasonAttribute(): string
    {
        $reasons = [
            'stock_opname' => 'Stock Opname',
            'damaged_goods' => 'Barang Rusak',
            'expired_goods' => 'Barang Kadaluarsa',
            'lost_goods' => 'Barang Hilang',
            'found_goods' => 'Barang Ditemukan',
            'correction' => 'Koreksi Data',
            'supplier_return' => 'Return ke Supplier',
            'customer_return' => 'Return dari Customer',
            'other' => 'Lainnya',
        ];

        return $reasons[$this->reason] ?? $this->reason;
    }

    public function getFormattedTypeAttribute(): string
    {
        return $this->type === 'increase' ? 'Penambahan' : 'Pengurangan';
    }
}
