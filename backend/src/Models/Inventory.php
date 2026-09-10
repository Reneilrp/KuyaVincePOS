<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    protected $table = 'inventories';

    protected $fillable = [
        'branch_id',
        'product_id',
        'stock_quantity',
        'price_override',
        'alert_threshold'
    ];

    protected $casts = [
        'stock_quantity' => 'decimal:2',
        'price_override' => 'decimal:2',
        'alert_threshold' => 'decimal:2'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
