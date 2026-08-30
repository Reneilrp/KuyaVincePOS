<?php

namespace SunmiPos\Backend\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $table = 'categories';

    protected $fillable = [
        'name',
        'color',
        'icon'
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
