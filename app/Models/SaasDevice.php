<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasDevice extends Model
{
    protected $table = 'saas_devices';

    protected $fillable = [
        'company_id',
        'device_name',
        'device_type',
        'machine_uuid',
        'ip_address',
        'os_version',
        'last_login_at',
        'status',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
