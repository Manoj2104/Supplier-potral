<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PaymentSetting extends Model
{
    protected $table = 'payment_settings';

    protected $guarded = ['id'];

    protected $casts = [
        'razorpay_enabled'       => 'boolean',
        'system_payment_enabled' => 'boolean',
    ];

    /**
     * Singleton getter for payment configuration
     */
    public static function getSettings(): self
    {
        $setting = self::first();
        if (!$setting) {
            $keySecret = env('RAZORPAY_KEY_SECRET', 'IJV3Oz9jY2oreUMtxVr77iOI');
            $whSecret  = env('RAZORPAY_WEBHOOK_SECRET', 'rzp_whsec_infypos2026_webhook');

            $setting = self::create([
                'active_provider'                   => 'razorpay',
                'razorpay_enabled'                  => true,
                'system_payment_enabled'            => false,
                'razorpay_mode'                     => env('RAZORPAY_MODE', 'test'),
                'razorpay_key_id'                   => env('RAZORPAY_KEY_ID', 'rzp_test_TfUvXTbtZxl0LL'),
                'razorpay_key_secret_encrypted'     => Crypt::encryptString($keySecret),
                'razorpay_webhook_secret_encrypted' => Crypt::encryptString($whSecret),
                'razorpay_plan_id'                  => 'plan_INFYPOS_MONTHLY_499',
                'merchant_name'                     => 'INFY-POS Enterprise',
                'system_payment_mode'               => 'system',
                'system_payment_verification'       => 'automatic',
                'currency'                          => 'INR',
            ]);
        }
        return $setting;
    }

    /**
     * Get authoritative active provider ('razorpay' or 'system')
     */
    public static function getActiveProvider(): string
    {
        $setting = self::getSettings();
        if ($setting->active_provider === 'razorpay' && $setting->razorpay_enabled) {
            return 'razorpay';
        }
        if ($setting->active_provider === 'system' && $setting->system_payment_enabled) {
            return 'system';
        }
        return 'none';
    }

    public static function isRazorpayActive(): bool
    {
        return self::getActiveProvider() === 'razorpay';
    }

    public static function isSystemActive(): bool
    {
        return self::getActiveProvider() === 'system';
    }

    /**
     * Safely decrypt Razorpay Key Secret (Server-side ONLY)
     */
    public function getDecryptedKeySecret(): string
    {
        if (empty($this->razorpay_key_secret_encrypted)) {
            return env('RAZORPAY_KEY_SECRET', '');
        }
        try {
            return Crypt::decryptString($this->razorpay_key_secret_encrypted);
        } catch (\Throwable $e) {
            return env('RAZORPAY_KEY_SECRET', '');
        }
    }

    /**
     * Safely decrypt Razorpay Webhook Secret (Server-side ONLY)
     */
    public function getDecryptedWebhookSecret(): string
    {
        if (empty($this->razorpay_webhook_secret_encrypted)) {
            return env('RAZORPAY_WEBHOOK_SECRET', '');
        }
        try {
            return Crypt::decryptString($this->razorpay_webhook_secret_encrypted);
        } catch (\Throwable $e) {
            return env('RAZORPAY_WEBHOOK_SECRET', '');
        }
    }

    /**
     * Check if Razorpay has valid configuration required to be enabled
     */
    public function isRazorpayConfigured(): bool
    {
        $secret = $this->getDecryptedKeySecret();
        return !empty($this->razorpay_key_id) && !empty($secret) && !empty($this->razorpay_plan_id);
    }

    /**
     * Return safe, sanitized representation for frontend (NEVER returns plaintext secrets)
     */
    public function toSanitizedArray(): array
    {
        $hasKeySecret = !empty($this->razorpay_key_secret_encrypted) || !empty(env('RAZORPAY_KEY_SECRET'));
        $hasWhSecret  = !empty($this->razorpay_webhook_secret_encrypted) || !empty(env('RAZORPAY_WEBHOOK_SECRET'));

        $domain = request() ? request()->getSchemeAndHttpHost() : (env('APP_URL') ?: 'http://127.0.0.1:8000');
        $webhookUrl = rtrim($domain, '/') . '/api/webhooks/razorpay';

        return [
            'id'                          => $this->id,
            'active_provider'             => $this->active_provider,
            'razorpay_enabled'            => (bool) $this->razorpay_enabled,
            'system_payment_enabled'      => (bool) $this->system_payment_enabled,
            'razorpay_mode'               => $this->razorpay_mode ?: 'test',
            'razorpay_key_id'             => $this->razorpay_key_id ?: '',
            'razorpay_key_secret_masked'  => $hasKeySecret ? '••••••••••••••••••••' : '',
            'razorpay_has_key_secret'     => $hasKeySecret,
            'razorpay_webhook_secret_masked' => $hasWhSecret ? '••••••••••••••••••••' : '',
            'razorpay_has_webhook_secret' => $hasWhSecret,
            'razorpay_plan_id'            => $this->razorpay_plan_id ?: 'plan_INFYPOS_MONTHLY_499',
            'merchant_name'               => $this->merchant_name ?: 'INFY-POS Enterprise',
            'webhook_url'                 => $webhookUrl,
            'system_payment_mode'         => $this->system_payment_mode ?: 'system',
            'system_payment_verification' => $this->system_payment_verification ?: 'automatic',
            'currency'                    => $this->currency ?: 'INR',
            'is_razorpay_configured'      => $this->isRazorpayConfigured(),
            'updated_at'                  => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
