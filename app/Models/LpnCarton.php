<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LpnCarton extends Model
{
    use HasFactory;

    protected $table = 'lpn_cartons';

    protected $fillable = [
        'lpn_number',
        'carton_number',
        'asn_id',
        'purchase_id',
        'supplier_id',
        'warehouse_id',
        'carton_type',
        'dimensions',
        'weight',
        'volume',
        'max_capacity',
        'status',
        'is_printed',
        'created_by',
    ];

    protected $casts = [
        'is_printed' => 'boolean',
        'weight' => 'float',
        'volume' => 'float',
    ];

    public function asn()
    {
        return $this->belongsTo(SupplierAsn::class, 'asn_id');
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function items()
    {
        return $this->hasMany(LpnItem::class, 'lpn_carton_id');
    }

    public static function generateLpnNumber(): string
    {
        // LPN-YYYYMMDD-HHMMSS-{SEQ3}{RAND4} — guaranteed unique even under concurrent creates
        $date  = date('Ymd');
        $time  = date('His');
        $seq   = self::whereDate('created_at', date('Y-m-d'))->count() + 1;
        $rand  = str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
        return 'LPN-' . $date . '-' . $time . str_pad($seq, 3, '0', STR_PAD_LEFT) . $rand;
    }
}
