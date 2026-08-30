<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'branch_id',
        'name',
        'email',
        'password',
        'role',
        'pin_code',
        'hourly_rate',
        'is_active'
    ];

    protected $hidden = [
        'password',
        'pin_code'
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'cashier_id');
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class, 'cashier_id');
    }

    public function timeclocks(): HasMany
    {
        return $this->hasMany(StaffTimeclock::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(PayrollRecord::class);
    }
}
