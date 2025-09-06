<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'code',
        'name',
        'company_name',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'email',
        'contact_person',
        'tax_number',
        'payment_term',
        'credit_limit',
        'notes',
        'is_active'
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
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

    public function getPaymentTermTextAttribute(): string
    {
        return match($this->payment_term) {
            'cash' => 'Cash',
            'credit_7' => 'Credit 7 Days',
            'credit_14' => 'Credit 14 Days',
            'credit_30' => 'Credit 30 Days',
            'credit_60' => 'Credit 60 Days',
            default => 'Cash'
        };
    }
}
