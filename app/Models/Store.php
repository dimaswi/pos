<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Store extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'email',
        'manager_name',
        'timezone',
        'currency',
        'tax_rate',
        'is_active',
        'business_hours'
    ];

    protected $casts = [
        'business_hours' => 'array',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_stores')
                    ->withPivot(['is_default'])
                    ->withTimestamps();
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Helpers
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->province,
            $this->postal_code
        ]);
        
        return implode(', ', $parts);
    }
}
