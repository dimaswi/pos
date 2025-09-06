<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'discount_percentage',
        'minimum_purchase',
        'maximum_discount',
        'is_active',
        'description',
    ];

    protected $casts = [
        'discount_percentage' => 'decimal:2',
        'minimum_purchase' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
