<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_transaction_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    // Relationships
    public function salesTransaction()
    {
        return $this->belongsTo(SalesTransaction::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Methods
    public function calculateTotal()
    {
        $subtotal = $this->quantity * $this->unit_price;
        $total = $subtotal - $this->discount_amount + $this->tax_amount;
        
        $this->update(['total_amount' => $total]);
        
        return $total;
    }
}
