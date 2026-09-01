<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierAsn extends Model
{
    use HasFactory;

    protected $table = 'supplier_asns';

    protected $fillable = [
        'asn_number', 'purchase_id', 'supplier_id',
        'vehicle_number', 'driver_name', 'driver_mobile',
        'transport_company', 'lr_number', 'invoice_number', 'eway_bill',
        'dispatch_date', 'expected_arrival', 'remarks',
        'invoice_pdf', 'packing_list', 'lr_copy', 'images',
        'status', 'rejection_reason',
    ];

    protected $casts = [
        'dispatch_date'    => 'date',
        'expected_arrival' => 'date',
        'images'           => 'array',
    ];

    public const STATUS_LABELS = [
        'draft'      => 'Draft',
        'pending'    => 'Pending',
        'accepted'   => 'Accepted',
        'rejected'   => 'Rejected',
        'in_transit' => 'In Transit',
        'receiving'  => 'Receiving',
        'verified'   => 'Scan Completed',
        'partial'    => 'Partial Scan Completed',
        'arrived'    => 'Arrived',
        'completed'  => 'Completed',
    ];

    public const STATUS_COLORS = [
        'draft'      => '#94A3B8',
        'pending'    => '#F59E0B',
        'accepted'   => '#10B981',
        'rejected'   => '#EF4444',
        'in_transit' => '#3B82F6',
        'receiving'  => '#F59E0B',
        'verified'   => '#10B981',
        'partial'    => '#F97316',
        'arrived'    => '#8B5CF6',
        'completed'  => '#059669',
    ];

    // ── Relationships ──────────────────────────────────────────────────
    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function cartons()
    {
        return $this->hasMany(LpnCarton::class, 'asn_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────
    public static function generateAsnNumber(): string
    {
        $last = static::orderByDesc('id')->value('id') ?? 0;
        return 'ASN-' . date('Y') . '-' . str_pad($last + 1, 5, '0', STR_PAD_LEFT);
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? ucfirst($this->status);
    }

    public function getStatusColorAttribute(): string
    {
        return self::STATUS_COLORS[$this->status] ?? '#94A3B8';
    }
}
