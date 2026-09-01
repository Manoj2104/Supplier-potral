<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseZone extends Model
{
    use HasFactory;

    protected $table = 'warehouse_zones';

    protected $fillable = [
        'name',
        'category',
        'color',
        'capacity'
    ];
}
