<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_number',
        'reference_number',
        'store_id',
        'customer_id',
        'user_id',
        'discount_id',
        'transaction_date',
        'subtotal_amount',
        'discount_amount',
        'customer_discount_amount',
        'customer_discount_percentage',
        'additional_discount_amount',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'change_amount',
        'status',
        'payment_status',
        'notes',
        'metadata',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'voided_at' => 'datetime',
        'subtotal_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'customer_discount_amount' => 'decimal:2',
        'customer_discount_percentage' => 'decimal:2',
        'additional_discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function voidedBy()
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function discount()
    {
        return $this->belongsTo(Discount::class);
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class);
    }

    public function items()
    {
        return $this->hasMany(SalesItem::class);
    }

    public function payments()
    {
        return $this->hasMany(SalesPayment::class);
    }

    public function returns()
    {
        return $this->hasMany(SalesReturn::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('transaction_date', today());
    }

    // Methods
    public function generateTransactionNumber()
    {
        $prefix = 'TRX';
        $date = now()->format('Ymd');
        $lastTransaction = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastTransaction ? intval(substr($lastTransaction->transaction_number, -4)) + 1 : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function calculateTotals()
    {
        $subtotal = $this->salesItems->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });

        $this->update([
            'subtotal_amount' => $subtotal,
            'total_amount' => $subtotal - $this->discount_amount + $this->tax_amount,
        ]);
    }

    public function addPayment($paymentMethodId, $amount, $reference = null)
    {
        return $this->payments()->create([
            'payment_method_id' => $paymentMethodId,
            'amount' => $amount,
            'reference_number' => $reference,
            'status' => 'completed',
        ]);
    }
}
