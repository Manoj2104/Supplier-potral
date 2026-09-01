<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseBin extends Model
{
    use HasFactory;

    protected $table = 'warehouse_bins';

    protected $fillable = [
        'bin_code',
        'zone_name',
        'max_capacity',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
