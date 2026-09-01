<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPortalSession extends Model
{
    use HasFactory;

    protected $table = 'supplier_portal_sessions';

    protected $fillable = [
        'supplier_portal_id', 'ip_address', 'user_agent',
        'device', 'browser', 'location',
        'login_at', 'logout_at', 'is_active',
    ];

    protected $casts = [
        'login_at'  => 'datetime',
        'logout_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function portal()
    {
        return $this->belongsTo(SupplierPortal::class, 'supplier_portal_id');
    }
}
