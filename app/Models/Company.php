<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Company extends Model
{
    protected $table = 'companies';

    protected $fillable = [
        'name',
        'owner_name',
        'email',
        'phone',
        'business_type',
        'gst_number',
        'country',
        'state',
        'city',
        'currency',
        'language',
        'timezone',
        'store_name',
        'address',
        'pin_code',
        'logo_url',
        'status',
        'trial_ends_at',
        'subscription_ends_at',
        'referral_code',
    ];

    protected $casts = [
        'trial_ends_at'        => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    public function subscriptions()
    {
        return $this->hasMany(CompanySubscription::class);
    }

    public function activationKeys()
    {
        return $this->hasMany(ActivationKey::class);
    }

    public function devices()
    {
        return $this->hasMany(SaasDevice::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function isTrialActive()
    {
        return $this->status === 'trial' && $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function isSubscriptionActive()
    {
        return ($this->status === 'active' || $this->status === 'trial') 
            && ($this->subscription_ends_at || $this->trial_ends_at)
            && (($this->subscription_ends_at && $this->subscription_ends_at->isFuture()) || ($this->trial_ends_at && $this->trial_ends_at->isFuture()));
    }

    public function getDaysRemainingAttribute()
    {
        $target = $this->subscription_ends_at ?: $this->trial_ends_at;
        if (!$target) return 0;
        return max(0, Carbon::now()->diffInDays($target, false));
    }
}
