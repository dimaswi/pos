<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'value',
        'store_id',
        'description',
        'minimum_amount',
        'maximum_discount',
        'usage_limit',
        'usage_limit_per_customer',
        'usage_count',
        'start_date',
        'end_date',
        'is_active',
        'apply_to_sale_items',
        'minimum_quantity',
        'get_quantity',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'minimum_amount' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'apply_to_sale_items' => 'boolean',
    ];

    /**
     * Get the store that owns the discount.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get the sales transactions that use this discount.
     */
    public function salesTransactions(): HasMany
    {
        return $this->hasMany(SalesTransaction::class);
    }

    /**
     * Check if discount is currently valid.
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();
        
        if ($this->start_date && $this->start_date > $now) {
            return false;
        }

        if ($this->end_date && $this->end_date < $now) {
            return false;
        }

        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount for given total.
     */
    public function calculateDiscountAmount(float $totalAmount): float
    {
        if (!$this->isValid()) {
            return 0;
        }

        if ($this->minimum_amount && $totalAmount < $this->minimum_amount) {
            return 0;
        }

        $discountAmount = 0;

        switch ($this->type) {
            case 'percentage':
                $discountAmount = $totalAmount * ($this->value / 100);
                break;
            case 'fixed':
                $discountAmount = $this->value;
                break;
            case 'buy_x_get_y':
                // This would need quantity-based calculation
                // Implementation depends on specific business logic
                $discountAmount = 0;
                break;
        }

        // Apply maximum discount limit
        if ($this->maximum_discount && $discountAmount > $this->maximum_discount) {
            $discountAmount = $this->maximum_discount;
        }

        return round($discountAmount, 2);
    }

    /**
     * Check if discount can be applied to specific store.
     */
    public function canApplyToStore(int $storeId): bool
    {
        // If store_id is null, discount applies to all stores
        return $this->store_id === null || $this->store_id === $storeId;
    }

    /**
     * Increment usage count.
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Scope for active discounts.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                          ->orWhere('end_date', '>=', now());
                    });
    }

    /**
     * Scope for expired discounts.
     */
    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', now());
    }

    /**
     * Scope for store-specific discounts.
     */
    public function scopeForStore($query, int $storeId)
    {
        return $query->where(function ($q) use ($storeId) {
            $q->whereNull('store_id')
              ->orWhere('store_id', $storeId);
        });
    }
}
