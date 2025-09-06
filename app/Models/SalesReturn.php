<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_number',
        'sales_transaction_id',
        'store_id',
        'return_date',
        'reason',
        'refund_amount',
        'status',
        'created_by',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'return_date' => 'date',
        'refund_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function salesTransaction(): BelongsTo
    {
        return $this->belongsTo(SalesTransaction::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function returnItems(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Methods
    public function canBeEdited(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeDeleted(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeRejected(): bool
    {
        return $this->status === 'pending';
    }

    public function getTotalItemsAttribute(): int
    {
        return $this->returnItems->sum('quantity');
    }

    public function getStatusBadgeAttribute(): array
    {
        $badges = [
            'pending' => ['color' => 'yellow', 'text' => 'Pending'],
            'approved' => ['color' => 'green', 'text' => 'Approved'],
            'rejected' => ['color' => 'red', 'text' => 'Rejected'],
        ];

        return $badges[$this->status] ?? ['color' => 'gray', 'text' => 'Unknown'];
    }
}
