<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderReceiveHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'received_by',
        'received_date',
        'notes',
        'items_received',
    ];

    protected $casts = [
        'received_date' => 'date',
        'items_received' => 'array',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
