<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BatchSyncLog extends Model
{
    protected $table = 'batch_sync_logs';

    protected $fillable = [
        'branch_id',
        'batch_id',
        'device_serial',
        'sync_date',
        'orders_count',
        'gross_sales',
        'status',
        'received_at'
    ];

    protected $casts = [
        'sync_date' => 'date',
        'gross_sales' => 'decimal:2',
        'received_at' => 'datetime'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'batch_sync_id');
    }
}
