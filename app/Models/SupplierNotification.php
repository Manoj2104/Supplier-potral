<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierNotification extends Model
{
    use HasFactory;

    protected $table = 'supplier_notifications';

    protected $fillable = [
        'supplier_id', 'type', 'title', 'message', 'data', 'is_read', 'read_at',
    ];

    protected $casts = [
        'data'     => 'array',
        'is_read'  => 'boolean',
        'read_at'  => 'datetime',
    ];

    public const TYPE_ICONS = [
        'new_po'          => '📋',
        'po_approved'     => '✅',
        'po_rejected'     => '❌',
        'asn_accepted'    => '🚛',
        'payment_released'=> '💰',
        'invoice_approved'=> '📄',
        'system'          => '🔔',
    ];

    public const TYPE_COLORS = [
        'new_po'          => '#3B82F6',
        'po_approved'     => '#10B981',
        'po_rejected'     => '#EF4444',
        'asn_accepted'    => '#8B5CF6',
        'payment_released'=> '#F59E0B',
        'invoice_approved'=> '#06B6D4',
        'system'          => '#6B7280',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function markAsRead(): void
    {
        $this->update(['is_read' => true, 'read_at' => now()]);
    }

    public static function createForSupplier(int $supplierId, string $type, string $title, string $message, array $data = []): self
    {
        return static::create([
            'supplier_id' => $supplierId,
            'type'        => $type,
            'title'       => $title,
            'message'     => $message,
            'data'        => $data,
        ]);
    }
}
