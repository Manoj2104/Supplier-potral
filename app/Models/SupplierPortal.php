<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class SupplierPortal extends Model
{
    use HasFactory;

    protected $table = 'supplier_portals';

    protected $fillable = [
        'supplier_id', 'username', 'password', 'supplier_code',
        'phone', 'alt_phone', 'gst', 'pan', 'fssai',
        'company_logo', 'profile_image',
        'bank_name', 'account_number', 'ifsc', 'upi', 'contact_person',
        'kyc_status', 'status', 'login_attempts', 'locked_until',
        'remember_token', 'two_fa_enabled', 'two_fa_secret',
        'otp_code', 'otp_expires_at',
        'last_login_at', 'last_login_ip',
        'welcome_message', 'email_notifications', 'sms_notifications',
    ];

    protected $hidden = ['password', 'two_fa_secret', 'otp_code', 'remember_token'];

    protected $casts = [
        'locked_until'     => 'datetime',
        'otp_expires_at'   => 'datetime',
        'last_login_at'    => 'datetime',
        'two_fa_enabled'   => 'boolean',
        'email_notifications' => 'boolean',
        'sms_notifications'   => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function asns()
    {
        return $this->hasMany(SupplierAsn::class, 'supplier_id', 'supplier_id');
    }

    public function portalSessions()
    {
        return $this->hasMany(SupplierPortalSession::class, 'supplier_portal_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────
    public function checkPassword(string $plain): bool
    {
        return Hash::check($plain, $this->password);
    }

    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function incrementLoginAttempts(): void
    {
        $this->increment('login_attempts');
        if ($this->login_attempts >= 5) {
            $this->update(['locked_until' => now()->addMinutes(30)]);
        }
    }

    public function resetLoginAttempts(): void
    {
        $this->update(['login_attempts' => 0, 'locked_until' => null]);
    }

    public function generateSupplierCode(): string
    {
        $max = static::max('id') ?? 0;
        return 'SUP-' . str_pad($max + 1, 5, '0', STR_PAD_LEFT);
    }
}
