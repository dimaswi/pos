<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustmentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_adjustment_id',
        'product_id',
        'current_quantity',
        'adjusted_quantity',
        'new_quantity',
        'unit_cost',
        'total_value_impact',
        'notes',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_value_impact' => 'decimal:2',
    ];

    // Relationships
    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Helper methods
    public function calculateTotalValueImpact(): void
    {
        $this->total_value_impact = $this->adjusted_quantity * $this->unit_cost;
        $this->save();
    }

    public function getAdjustmentTypeAttribute(): string
    {
        return $this->adjusted_quantity > 0 ? 'increase' : 'decrease';
    }

    public function getAbsoluteAdjustedQuantityAttribute(): int
    {
        return abs($this->adjusted_quantity);
    }
}
