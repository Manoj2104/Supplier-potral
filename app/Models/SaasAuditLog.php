<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasAuditLog extends Model
{
    protected $table = 'saas_audit_logs';

    protected $fillable = [
        'company_id',
        'user_id',
        'action',
        'details',
        'ip_address',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
