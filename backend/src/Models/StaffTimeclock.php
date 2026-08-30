<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffTimeclock extends Model
{
    protected $table = 'staff_timeclocks';

    protected $fillable = [
        'user_id',
        'branch_id',
        'device_id',
        'clock_in_at',
        'clock_out_at',
        'total_hours',
        'status',
        'notes'
    ];

    protected $casts = [
        'clock_in_at' => 'datetime',
        'clock_out_at' => 'datetime',
        'total_hours' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
