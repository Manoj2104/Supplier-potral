<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    protected $table = 'subscription_payments';

    protected $fillable = [
        'user_id',
        'company_id',
        'subscription_id',
        'razorpay_payment_id',
        'razorpay_order_id',
        'razorpay_subscription_id',
        'razorpay_signature',
        'amount',
        'currency',
        'status',
        'method',
        'email',
        'contact',
        'captured_at',
        'failure_reason',
        'raw_reference',
    ];

    protected $casts = [
        'captured_at'   => 'datetime',
        'raw_reference' => 'array',
        'amount'        => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function subscription()
    {
        return $this->belongsTo(CompanySubscription::class, 'subscription_id');
    }
}
