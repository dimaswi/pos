<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'fee_percentage',
        'fee_fixed',
        'requires_reference',
        'requires_authorization',
        'sort_order',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'fee_percentage' => 'decimal:2',
        'fee_fixed' => 'decimal:2',
        'requires_reference' => 'boolean',
        'requires_authorization' => 'boolean',
        'sort_order' => 'integer',
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function salesPayments()
    {
        return $this->hasMany(SalesPayment::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // Mutators
    public function setCodeAttribute($value)
    {
        $this->attributes['code'] = strtoupper($value);
    }

    // Methods
    public function calculateFee($amount)
    {
        $percentageFee = $amount * ($this->fee_percentage / 100);
        $totalFee = $percentageFee + $this->fee_fixed;
        
        return round($totalFee, 2);
    }

    public function toggleStatus()
    {
        $this->update(['is_active' => !$this->is_active]);
    }
}
