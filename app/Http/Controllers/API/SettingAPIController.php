<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\SettingResource;
use App\Models\Country;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\Setting;
use App\Models\State;
use App\Models\Warehouse;
use App\Repositories\SettingRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * Class SettingAPIController
 */
class SettingAPIController extends AppBaseController
{
    /** @var SettingRepository */
    private $settingRepository;

    public function __construct(SettingRepository $productRepository)
    {
        $this->settingRepository = $productRepository;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $settings = Setting::all()->pluck('value', 'key')->toArray();
            $settings['logo'] = getLogoUrl();
            $defaultWh = $settings['default_warehouse'] ?? null;
            $defaultCust = $settings['default_customer'] ?? null;
            $defaultCurr = $settings['currency'] ?? null;

            $settings['warehouse_name'] = $defaultWh ? (Warehouse::whereId($defaultWh)->first()?->name ?? '') : '';
            $settings['customer_name'] = $defaultCust ? (Customer::whereId($defaultCust)->first()?->name ?? '') : '';
            $settings['currency_symbol'] = $defaultCurr ? (Currency::whereId($defaultCurr)->first()?->symbol ?? '₹') : '₹';
            $settings['countries'] = Country::all();

            return $this->sendResponse(new SettingResource(['type' => 'settings', 'attributes' => $settings]),
                'Setting data retrieved successfully.');
        } catch (\Throwable $e) {
            \Log::error('Settings index error: ' . $e->getMessage());
            return $this->sendResponse(new SettingResource(['type' => 'settings', 'attributes' => []]), 'Setting data retrieved.');
        }
    }

    public function update(Request $request): JsonResponse
    {
        $input = $request->all();
        if ($request->hasFile('logo')) {
            $input['logo'] = $request->file('logo');
        }
        $settings = $this->settingRepository->updateSettings($input);

        return $this->sendResponse(new SettingResource(['type' => 'settings', 'attributes' => $settings]),
            'Setting data updated successfully');
    }

    public function clearCache(): JsonResponse
    {
        Artisan::call('cache:clear');

        return $this->sendSuccess(__('messages.success.cache_clear_successfully'));
    }

    public function getFrontSettingsValue(): JsonResponse
    {
        try {
            $keyName = [
                'currency', 'email', 'company_name', 'phone', 'developed', 'footer', 'default_language', 'default_customer',
                'default_warehouse', 'address', 'show_app_name_in_sidebar'
            ];
            $settings = Setting::whereIn('key', $keyName)->pluck('value', 'key')->toArray();
            $settings['logo'] = getLogoUrl();
            $defaultWh = $settings['default_warehouse'] ?? null;
            $defaultCust = $settings['default_customer'] ?? null;
            $defaultCurr = $settings['currency'] ?? null;

            $settings['warehouse_name'] = $defaultWh ? (Warehouse::whereId($defaultWh)->first()?->name ?? '') : '';
            $settings['customer_name'] = $defaultCust ? (Customer::whereId($defaultCust)->first()?->name ?? '') : '';
            $settings['currency_symbol'] = $defaultCurr ? (Currency::whereId($defaultCurr)->first()?->symbol ?? '₹') : '₹';

            return $this->sendResponse(new SettingResource(['type' => 'settings', 'value' => $settings]),
                'Setting value retrieved successfully.');
        } catch (\Throwable $e) {
            \Log::error('Front Settings Error: ' . $e->getMessage());
            $fallback = [
                'currency' => 'INR',
                'currency_symbol' => '₹',
                'email' => 'admin@infypos.com',
                'company_name' => 'Suguna Enterprise WMS & POS Hub',
                'phone' => '',
                'developed' => 'Suguna',
                'footer' => 'Suguna POS',
                'default_language' => 'en',
                'default_customer' => '1',
                'default_warehouse' => '1',
                'address' => 'HQ',
                'show_app_name_in_sidebar' => '1',
                'logo' => asset('images/logo.png'),
                'warehouse_name' => 'Default Warehouse',
                'customer_name' => 'Walk-in Customer',
            ];
            return $this->sendResponse(new SettingResource(['type' => 'settings', 'value' => $fallback]),
                'Setting value retrieved successfully.');
        }
    }

    public function getStates($countryId): JsonResponse
    {
        $states = State::whereCountryId($countryId)->pluck('name');

        return $this->sendResponse(new SettingResource(['type' => 'states', 'value' => $states]),
            'States retrieved successfully.');
    }

    public function getMailSettings()
    {
        $envData = $this->settingRepository->getEnvData();

        return $this->sendResponse($envData, 'Mail Credential Retrieved Successfully');
    }

    public function updateMailSettings(Request $request): JsonResponse
    {
        $request->validate([
            'mail_mailer', 'mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_from_address', 'mail_encryption',
        ]);
        $this->settingRepository->updateMailEnvSetting($request->all());

        Artisan::call('optimize:clear');
        Artisan::call('config:cache');

        return $this->sendSuccess('Mail Settings Save Successfully');
    }
}
