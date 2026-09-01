<?php

namespace App\Http\Controllers;

use App\Services\CloudLicenseServerService;
use App\Services\LocalLicenseEngine;
use App\Models\ActivationKey;
use App\Models\SaasDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * REST API Controller for Enterprise Cloud License Server
 * Handlers for /api/license/verify, /api/license/heartbeat, and /api/license/unbind
 */
class LicenseApiController extends Controller
{
    /**
     * POST /api/license/verify
     * Verifies Activation Key against Cloud DB, binds Hardware UUID, and generates signed license token.
     */
    public function verify(Request $request)
    {
        $payload = $request->all();
        $result = CloudLicenseServerService::verifyAndActivateKey($payload);

        if ($result['success']) {
            // Save local license file token
            LocalLicenseEngine::saveLocalLicense($result['signed_payload']);
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * POST /api/license/heartbeat
     * Called every 12 hours or on POS login to sync telemetry, trial status, and machine lock integrity.
     */
    public function heartbeat(Request $request)
    {
        $machineUuid = strtoupper(trim($request->input('machine_uuid', CloudLicenseServerService::getMachineUuid())));
        $keyCode = strtoupper(trim($request->input('key_code', '')));

        if ($keyCode) {
            $keyRecord = ActivationKey::where('key_code', $keyCode)->first();
            if ($keyRecord) {
                // Update device last seen
                try {
                    SaasDevice::where('machine_uuid', $machineUuid)->update([
                        'last_login_at' => Carbon::now(),
                        'status'        => 'Online',
                    ]);
                } catch (\Throwable $de) {}

                $isExpired = $keyRecord->expires_at && Carbon::now()->greaterThan($keyRecord->expires_at);

                return response()->json([
                    'success'         => true,
                    'status'          => $keyRecord->status === 'revoked' ? 'revoked' : ($isExpired ? 'expired' : 'active'),
                    'key_code'        => $keyRecord->key_code,
                    'expires_at'      => $keyRecord->expires_at ? Carbon::parse($keyRecord->expires_at)->format('d M Y') : 'N/A',
                    'days_remaining'  => $keyRecord->expires_at ? max(0, Carbon::now()->diffInDays($keyRecord->expires_at, false)) : 365,
                ]);
            }
        }

        $localStatus = LocalLicenseEngine::getLocalLicenseStatus();
        return response()->json(['success' => true, 'local_telemetry' => $localStatus]);
    }

    /**
     * POST /api/license/unbind
     */
    public function unbind(Request $request)
    {
        $keyCode = strtoupper(trim($request->input('key_code', '')));
        $keyRecord = ActivationKey::where('key_code', $keyCode)->first();

        if ($keyRecord) {
            $keyRecord->update(['machine_fingerprint' => null, 'status' => 'unused']);
            return response()->json(['success' => true, 'message' => "Machine lock binding for key '{$keyCode}' reset successfully."]);
        }

        return response()->json(['success' => false, 'message' => "Key '{$keyCode}' not found."], 404);
    }
}
