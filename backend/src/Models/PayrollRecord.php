<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollRecord extends Model
{
    protected $table = 'payroll_records';

    protected $fillable = [
        'user_id',
        'branch_id',
        'period_start',
        'period_end',
        'hourly_rate',
        'total_hours_worked',
        'gross_pay',
        'deductions',
        'bonuses',
        'net_pay',
        'status'
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'hourly_rate' => 'decimal:2',
        'total_hours_worked' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'deductions' => 'decimal:2',
        'bonuses' => 'decimal:2',
        'net_pay' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
