<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_number',
        'from_store_id',
        'to_store_id',
        'transfer_date',
        'status',
        'notes',
        'total_value',
        'created_by',
        'approved_by',
        'received_by',
        'approved_at',
        'shipped_at',
        'received_at',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'approved_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
        'total_value' => 'decimal:2',
    ];

    // Boot method to generate transfer number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = self::generateTransferNumber();
            }
        });
    }

    // Generate unique transfer number
    public static function generateTransferNumber()
    {
        $prefix = 'TRF';
        $date = now()->format('Ymd');
        $lastTransfer = self::where('transfer_number', 'like', $prefix . $date . '%')
            ->orderBy('transfer_number', 'desc')
            ->first();

        if ($lastTransfer) {
            $lastNumber = intval(substr($lastTransfer->transfer_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix . $date . $newNumber;
    }

    // Relationships
    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'from_store_id');
    }

    public function toStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'to_store_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function receivedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    // Accessors
    public function getFormattedStatusAttribute()
    {
        return match($this->status) {
            'draft' => 'Draft',
            'pending' => 'Menunggu Persetujuan',
            'in_transit' => 'Dalam Perjalanan',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            default => $this->status,
        };
    }

    public function getCanBeEditedAttribute()
    {
        return in_array($this->status, ['draft']);
    }

    public function getCanBeApprovedAttribute()
    {
        return $this->status === 'pending';
    }

    public function getCanBeShippedAttribute()
    {
        return $this->status === 'pending';
    }

    public function getCanBeReceivedAttribute()
    {
        return $this->status === 'in_transit';
    }

    public function getCanBeCancelledAttribute()
    {
        return in_array($this->status, ['draft', 'pending']);
    }

    // Scopes
    public function scopeByStore($query, $storeId)
    {
        return $query->where(function($q) use ($storeId) {
            $q->where('from_store_id', $storeId)
              ->orWhere('to_store_id', $storeId);
        });
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('transfer_number', 'like', "%{$search}%")
              ->orWhere('notes', 'like', "%{$search}%")
              ->orWhereHas('fromStore', function($store) use ($search) {
                  $store->where('name', 'like', "%{$search}%");
              })
              ->orWhereHas('toStore', function($store) use ($search) {
                  $store->where('name', 'like', "%{$search}%");
              });
        });
    }

    // Methods
    public function calculateTotalValue()
    {
        $this->total_value = $this->items()->sum('total_cost');
        $this->save();
        return $this->total_value;
    }

    public function approve($userId)
    {
        $this->update([
            'status' => 'pending',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }

    public function ship($userId)
    {
        $this->update([
            'status' => 'in_transit',
            'shipped_at' => now(),
        ]);

        // Reduce stock from source store
        foreach ($this->items as $item) {
            $inventory = Inventory::where('store_id', $this->from_store_id)
                ->where('product_id', $item->product_id)
                ->first();

            if ($inventory) {
                $inventory->decrement('current_stock', $item->quantity_shipped);
                
                // Create stock movement record
                StockMovement::create([
                    'store_id' => $this->from_store_id,
                    'product_id' => $item->product_id,
                    'type' => 'transfer_out',
                    'quantity' => -$item->quantity_shipped,
                    'reference_type' => 'stock_transfer',
                    'reference_id' => $this->id,
                    'notes' => "Transfer ke {$this->toStore->name} - {$this->transfer_number}",
                    'created_by' => $userId,
                ]);
            }
        }
    }

    public function receive($userId, $receivedItems = [])
    {
        foreach ($receivedItems as $itemId => $quantityReceived) {
            $item = $this->items()->find($itemId);
            if ($item) {
                $item->update(['quantity_received' => $quantityReceived]);

                // Add stock to destination store
                $inventory = Inventory::firstOrCreate(
                    [
                        'store_id' => $this->to_store_id,
                        'product_id' => $item->product_id,
                    ],
                    [
                        'current_stock' => 0,
                        'minimum_stock' => 0,
                    ]
                );

                $inventory->increment('current_stock', $quantityReceived);

                // Create stock movement record
                StockMovement::create([
                    'store_id' => $this->to_store_id,
                    'product_id' => $item->product_id,
                    'type' => 'transfer_in',
                    'quantity' => $quantityReceived,
                    'reference_type' => 'stock_transfer',
                    'reference_id' => $this->id,
                    'notes' => "Transfer dari {$this->fromStore->name} - {$this->transfer_number}",
                    'created_by' => $userId,
                ]);
            }
        }

        $this->update([
            'status' => 'completed',
            'received_by' => $userId,
            'received_at' => now(),
        ]);
    }

    public function cancel($reason = null)
    {
        $this->update([
            'status' => 'cancelled',
            'notes' => $this->notes . ($reason ? "\n\nDibatalkan: {$reason}" : ''),
        ]);
    }
}
