<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'product_id',
        'quantity',
        'minimum_stock',
        'maximum_stock',
        'average_cost',
        'last_cost',
        'location',
        'last_restock_date',
    ];

    protected $casts = [
        'last_restock_date' => 'date',
        'quantity' => 'integer',
        'minimum_stock' => 'integer',
        'maximum_stock' => 'integer',
        'average_cost' => 'decimal:2',
        'last_cost' => 'decimal:2',
    ];

    protected $appends = [
        'stock_value',
        'stock_status'
    ];

    // Relationships
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Scopes
    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'minimum_stock');
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }

    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Helper methods
    public function isLowStock(): bool
    {
        return $this->quantity <= $this->minimum_stock;
    }

    public function isOutOfStock(): bool
    {
        return $this->quantity <= 0;
    }

    public function getStockStatusAttribute(): string
    {
        if ($this->isOutOfStock()) {
            return 'out_of_stock';
        }
        
        if ($this->isLowStock()) {
            return 'low_stock';
        }
        
        return 'in_stock';
    }

    public function getStockValueAttribute(): float
    {
        return $this->quantity * $this->average_cost;
    }
}
