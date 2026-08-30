<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAdjustment extends Model
{
    protected $table = 'inventory_adjustments';

    protected $fillable = [
        'branch_id',
        'product_id',
        'user_id',
        'type',
        'quantity_change',
        'stock_after',
        'notes'
    ];

    protected $casts = [
        'quantity_change' => 'decimal:2',
        'stock_after' => 'decimal:2'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
