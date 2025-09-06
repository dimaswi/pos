<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'po_number',
        'store_id',
        'supplier_id',
        'created_by',
        'order_date',
        'expected_date',
        'received_date',
        'status',
        'subtotal',
        'tax_amount',
        'shipping_cost',
        'discount_amount',
        'total_amount',
        'notes',
        'approval_data',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_date' => 'date',
        'received_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'approval_data' => 'array',
    ];

    // Relationships
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function receiveHistory(): HasMany
    {
        return $this->hasMany(PurchaseOrderReceiveHistory::class)->orderBy('created_at', 'desc');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
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

    public function scopePending($query)
    {
        return $query->whereIn('status', ['draft', 'pending', 'approved']);
    }

    // Helper methods
    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'pending']);
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeReceived(): bool
    {
        return in_array($this->status, ['approved', 'ordered', 'partial_received']);
    }

    public function calculateTotal(): void
    {
        $subtotal = $this->items->sum(function ($item) {
            return $item->quantity_ordered * $item->unit_cost;
        });

        $this->subtotal = $subtotal;
        $this->total_amount = $subtotal + $this->tax_amount + $this->shipping_cost - $this->discount_amount;
    }

    public function getProgressPercentageAttribute(): float
    {
        if (!$this->relationLoaded('items') || $this->items->isEmpty()) {
            return 0;
        }

        $totalOrdered = $this->items->sum('quantity_ordered');
        $totalReceived = $this->items->sum('quantity_received');

        if ($totalOrdered === 0) {
            return 0;
        }

        return round(($totalReceived / $totalOrdered) * 100, 2);
    }
}
