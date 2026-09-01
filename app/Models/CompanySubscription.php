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
        'payment_gateway',
        'razorpay_payment_id',
        'razorpay_order_id',
        'status',
        'starts_at',
        'ends_at',
        'invoice_number',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
        'amount'    => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
