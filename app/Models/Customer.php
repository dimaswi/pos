<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'email',
        'phone',
        'address',
        'birth_date',
        'gender',
        'customer_discount_id',
        'membership_date',
        'total_points',
        'total_spent',
        'total_transactions',
        'last_transaction_date',
        'notes',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'membership_date' => 'date',
        'last_transaction_date' => 'date',
        'total_points' => 'decimal:2',
        'total_spent' => 'decimal:2',
        'total_transactions' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function salesTransactions()
    {
        return $this->hasMany(SalesTransaction::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function discounts()
    {
        return $this->belongsToMany(Discount::class, 'customer_discounts')
                    ->withTimestamps();
    }

    public function customerDiscount()
    {
        return $this->belongsTo(CustomerDiscount::class, 'customer_discount_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByDiscount($query, $discountId)
    {
        return $query->where('customer_discount_id', $discountId);
    }

    public function scopeMembers($query)
    {
        return $query->whereNotNull('customer_discount_id');
    }

    // Mutators
    public function setCodeAttribute($value)
    {
        $this->attributes['code'] = strtoupper($value);
    }

    // Accessors
    public function getIsMemberAttribute()
    {
        return !is_null($this->customer_discount_id);
    }

    public function getPointsBalanceAttribute()
    {
        return $this->total_points;
    }

    // Methods
    public function addPoints($points)
    {
        $this->increment('total_points', $points);
    }

    public function deductPoints($points)
    {
        if ($this->total_points >= $points) {
            $this->decrement('total_points', $points);
            return true;
        }
        return false;
    }

    public function updateTransactionStats($amount)
    {
        $this->increment('total_spent', $amount);
        $this->increment('total_transactions');
        $this->update(['last_transaction_date' => now()->toDateString()]);
    }

    public function getDiscountPercentageAttribute(): float
    {
        return $this->customerDiscount?->discount_percentage ?? 0;
    }
}
