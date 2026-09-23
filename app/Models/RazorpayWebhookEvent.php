<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RazorpayWebhookEvent extends Model
{
    protected $table = 'razorpay_webhook_events';

    protected $fillable = [
        'event_id',
        'event_type',
        'payload_hash',
        'payload',
        'processing_status',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];
}
