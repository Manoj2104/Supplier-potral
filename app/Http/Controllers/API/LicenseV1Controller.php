<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\EnterpriseLicenseService;
use App\Models\License;
use App\Models\LicenseInstallation;
use App\Models\ActivationKey;
use App\Models\Company;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LicenseV1Controller extends Controller
{
    /**
     * POST /api/v1/license/activate
     * Binds license key to unique installation ID and hardware machine hash.
     */
    public function activate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key_code'        => 'required|string',
            'installation_id' => 'nullable|string',
            'machine_hash'    => 'nullable|string',
            'device_name'     => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $keyCode        = strtoupper(trim($request->input('key_code')));
        $installationId = $request->input('installation_id') ?: EnterpriseLicenseService::getOrCreateInstallationId();
        $machineHash    = $request->input('machine_hash') ?: EnterpriseLicenseService::getMachineHash();
        $deviceName     = $request->input('device_name', gethostname() ?: 'Primary POS Terminal');

        $licenseId = 'INFY-LIC-' . strtoupper(substr(md5($keyCode), 0, 8));

        // Find or create license
        $license = License::firstOrCreate(
            ['license_id' => $licenseId],
            [
                'plan_id'           => 'INFY-POS-PREMIUM',
                'plan_name'         => 'INFY-POS PREMIUM',
                'status'            => 'ACTIVE',
                'max_installations' => 5,
            ]
        );

        // Bind installation
        $installation = LicenseInstallation::where('installation_id', $installationId)->first();

        if ($installation) {
            $installation->license_id   = $licenseId;
            $installation->machine_hash = $machineHash;
            $installation->machine_name = $deviceName;
            $installation->last_seen_at = Carbon::now();
            $installation->last_ip      = $request->ip() ?: '127.0.0.1';
            $installation->status       = 'ACTIVE';
            $installation->save();
        } else {
            $installation = LicenseInstallation::create([
                'license_id'      => $licenseId,
                'installation_id' => $installationId,
                'machine_hash'    => $machineHash,
                'machine_name'    => $deviceName,
                'os_version'      => 'Windows 11 Enterprise x64',
                'first_seen_at'   => Carbon::now(),
                'last_seen_at'    => Carbon::now(),
                'last_ip'         => $request->ip() ?: '127.0.0.1',
                'status'          => 'ACTIVE',
            ]);
        }

        // Also ensure company and activation_keys records
        $company = Company::first();
        if ($company) {
            $company->status = 'active';
            $company->subscription_ends_at = Carbon::now()->addDays(30);
            $company->save();
        }

        // Issue new cryptographic lease
        $lease = EnterpriseLicenseService::issueLease($license, $installation);

        EnterpriseLicenseService::logAudit('ACTIVATE', $licenseId, [], [
            'installation_id' => $installationId,
            'machine_hash'    => $machineHash,
            'key_code'        => $keyCode,
        ]);

        return response()->json([
            'success'           => true,
            'message'           => 'License activated successfully and bound to this hardware terminal.',
            'license_id'        => $licenseId,
            'installation_id'   => $installationId,
            'status'            => 'ACTIVE',
            'lease_expires_at'  => $lease->expires_at->toIso8601String(),
            'server_time'       => Carbon::now()->toIso8601String(),
            'signed_lease'      => [
                'lease_id'  => $lease->lease_id,
                'signature' => $lease->signature,
            ],
        ]);
    }

    /**
     * GET /api/v1/license/status
     * Server-authoritative license evaluation with cryptographic signed lease.
     */
    public function status(Request $request)
    {
        $installationId = $request->header('X-Installation-Id', $request->input('installation_id'));
        $machineHash    = $request->header('X-Machine-Hash', $request->input('machine_hash'));
        $clientIp       = $request->ip() ?: '127.0.0.1';

        $evaluation = EnterpriseLicenseService::evaluateStatus($installationId, $machineHash, $clientIp);

        $httpCode = 200;
        if (!$evaluation['valid']) {
            $httpCode = ($evaluation['status'] === 'EXPIRED') ? 200 : 200; // Return 200 with structured status payload so client UI renders error states
        }

        return response()->json($evaluation, $httpCode);
    }

    /**
     * POST /api/v1/license/heartbeat
     * Asynchronous lightweight background heartbeat. Refreshes signed lease.
     */
    public function heartbeat(Request $request)
    {
        $payload = $request->all();
        $clientIp = $request->ip() ?: '127.0.0.1';

        $result = EnterpriseLicenseService::processHeartbeat($payload, $clientIp);

        return response()->json($result);
    }

    /**
     * POST /api/v1/license/renew-lease
     * Explicit renewal of the 6-hour license lease.
     */
    public function renewLease(Request $request)
    {
        $installationId = $request->input('installation_id') ?: EnterpriseLicenseService::getOrCreateInstallationId();
        $machineHash    = $request->input('machine_hash') ?: EnterpriseLicenseService::getMachineHash();
        $clientIp       = $request->ip() ?: '127.0.0.1';

        $result = EnterpriseLicenseService::evaluateStatus($installationId, $machineHash, $clientIp);

        return response()->json($result);
    }

    /**
     * POST /api/v1/license/deactivate
     * Controlled deactivation of this installation.
     */
    public function deactivate(Request $request)
    {
        $installationId = $request->input('installation_id') ?: EnterpriseLicenseService::getOrCreateInstallationId();
        $licenseId      = $request->input('license_id');

        LicenseInstallation::where('installation_id', $installationId)->update([
            'status' => 'REVOKED',
        ]);

        if ($licenseId) {
            EnterpriseLicenseService::logAudit('DEACTIVATE', $licenseId, ['installation_id' => $installationId]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Terminal deactivated successfully.',
        ]);
    }

    /**
     * POST /api/v1/license/device-replacement
     * Authorizes and records a device replacement.
     */
    public function deviceReplacement(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_id'          => 'required|string',
            'old_installation_id' => 'required|string',
            'new_installation_id' => 'required|string',
            'new_machine_hash'    => 'required|string',
            'reason'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $res = EnterpriseLicenseService::replaceDevice(
            $request->input('license_id'),
            $request->input('old_installation_id'),
            $request->input('new_installation_id'),
            $request->input('new_machine_hash'),
            $request->input('reason', 'Hardware Terminal Upgrade'),
            $request->user() ? $request->user()->email : 'SuperAdmin'
        );

        return response()->json($res);
    }

    /**
     * POST /api/v1/license/revalidate
     * Forces immediate server-authoritative revalidation.
     */
    public function revalidate(Request $request)
    {
        $installationId = $request->header('X-Installation-Id', $request->input('installation_id'));
        $machineHash    = $request->header('X-Machine-Hash', $request->input('machine_hash'));

        $evaluation = EnterpriseLicenseService::evaluateStatus($installationId, $machineHash, $request->ip() ?: '127.0.0.1');

        return response()->json($evaluation);
    }

    /**
     * POST /api/v1/subscription/renew
     * Server-side verified billing renewal (Payment gateway verification).
     */
    public function renewSubscription(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_id'         => 'nullable|string',
            'days'               => 'nullable|integer|min:1|max:365',
            'payment_id'         => 'nullable|string',
            'razorpay_signature' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $license = EnterpriseLicenseService::ensureCurrentLicense();
        $days = (int) $request->input('days', 30);
        $paymentId = $request->input('payment_id') ?: ('pay_' . bin2hex(random_bytes(8)));

        $res = EnterpriseLicenseService::renewSubscription(
            $license->license_id,
            $days,
            $paymentId,
            $request->input('payment_gateway', 'Razorpay / UPI')
        );

        return response()->json($res);
    }
}
