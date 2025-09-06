<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_transfer_id',
        'product_id',
        'quantity_requested',
        'quantity_shipped',
        'quantity_received',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'quantity_shipped' => 'integer',
        'quantity_received' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Boot method to calculate total cost
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->total_cost = $item->quantity_requested * $item->unit_cost;
        });
    }

    // Relationships
    public function stockTransfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getQuantityRemainingAttribute()
    {
        return $this->quantity_requested - $this->quantity_shipped;
    }

    public function getQuantityShortageAttribute()
    {
        return $this->quantity_shipped - $this->quantity_received;
    }

    public function getFormattedUnitCostAttribute()
    {
        return number_format($this->unit_cost, 0, ',', '.');
    }

    public function getFormattedTotalCostAttribute()
    {
        return number_format($this->total_cost, 0, ',', '.');
    }
}
