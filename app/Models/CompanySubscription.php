<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySubscription extends Model
{
    protected $table = 'company_subscriptions';

    protected $fillable = [
        'company_id',
        'plan_name',
        'amount',
        'billing_interval',
        'auto_renewal',
        'payment_gateway',
        'razorpay_payment_id',
        'razorpay_order_id',
        'razorpay_subscription_id',
        'razorpay_plan_id',
        'razorpay_customer_id',
        'status',
        'starts_at',
        'ends_at',
        'current_period_start',
        'current_period_end',
        'next_billing_at',
        'grace_period_until',
        'last_payment_id',
        'cancelled_at',
        'ended_at',
        'invoice_number',
    ];

    protected $casts = [
        'starts_at'             => 'datetime',
        'ends_at'               => 'datetime',
        'current_period_start'  => 'datetime',
        'current_period_end'    => 'datetime',
        'next_billing_at'       => 'datetime',
        'grace_period_until'    => 'datetime',
        'cancelled_at'          => 'datetime',
        'ended_at'              => 'datetime',
        'auto_renewal'          => 'boolean',
        'amount'                => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
