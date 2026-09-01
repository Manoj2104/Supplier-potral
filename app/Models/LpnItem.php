<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LpnItem extends Model
{
    use HasFactory;

    protected $table = 'lpn_items';

    protected $fillable = [
        'lpn_carton_id',
        'product_id',
        'sku',
        'barcode',
        'batch_number',
        'expiry_date',
        'packed_quantity',
        'received_quantity',
        'status',
    ];

    public function carton()
    {
        return $this->belongsTo(LpnCarton::class, 'lpn_carton_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
