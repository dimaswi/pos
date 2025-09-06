<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'description',
        'category_id',
        'supplier_id',
        'unit',
        'purchase_price',
        'selling_price',
        'minimum_price',
        'average_cost',
        'weight',
        'image',
        'images',
        'is_track_stock',
        'minimum_stock',
        'is_active',
        'attributes'
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'minimum_price' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'weight' => 'decimal:2',
        'images' => 'array',
        'attributes' => 'array',
        'is_track_stock' => 'boolean',
        'is_active' => 'boolean',
        'minimum_stock' => 'integer'
    ];

    protected $appends = [
        'price',
        'current_stock'
    ];

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeTrackStock($query)
    {
        return $query->where('is_track_stock', true);
    }

    // Helpers
    public function getMarginAttribute(): float
    {
        $purchasePrice = (float) ($this->purchase_price ?? 0);
        $sellingPrice = (float) ($this->selling_price ?? 0);
        
        if ($purchasePrice > 0) {
            return (($sellingPrice - $purchasePrice) / $purchasePrice) * 100;
        }
        return 0;
    }

    public function getProfitAttribute(): float
    {
        $sellingPrice = (float) ($this->selling_price ?? 0);
        $purchasePrice = (float) ($this->purchase_price ?? 0);
        
        return $sellingPrice - $purchasePrice;
    }

    public function getPriceAttribute(): float
    {
        return (float) ($this->selling_price ?? 0);
    }

    public function getCurrentStockAttribute(): int
    {
        return (int) ($this->inventories()->sum('quantity') ?? 0);
    }
}
