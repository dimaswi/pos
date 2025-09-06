<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'sales_item_id',
        'product_id',
        'quantity',
        'unit_price',
        'refund_amount',
        'reason',
        'condition',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
    ];

    // Relationships
    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function salesItem(): BelongsTo
    {
        return $this->belongsTo(SalesItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Methods
    public function getConditionBadgeAttribute(): array
    {
        $badges = [
            'good' => ['color' => 'green', 'text' => 'Good'],
            'damaged' => ['color' => 'yellow', 'text' => 'Damaged'],
            'defective' => ['color' => 'red', 'text' => 'Defective'],
        ];

        return $badges[$this->condition] ?? ['color' => 'gray', 'text' => 'Unknown'];
    }

    public function getTotalRefundAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
