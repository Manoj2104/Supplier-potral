<?php
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
if (!function_exists('getSettingValue')) { function getSettingValue($key) { try { $setting = Setting::where('key', $key)->first(); return $setting ? $setting->value : null; } catch (\Exception $e) { return null; } } }
if (!function_exists('getCurrencyCode')) { function getCurrencyCode() { return getSettingValue('currency') ?? 'INR'; } }
if (!function_exists('getLogoUrl')) {
    function getLogoUrl() {
        try {
            $setting = Setting::where('key', 'logo')->first();
            if ($setting) {
                $media = $setting->media()->latest()->first();
                if (!empty($media)) {
                    return $media->getFullUrl();
                }
                if (!empty($setting->value)) {
                    if (filter_var($setting->value, FILTER_VALIDATE_URL)) {
                        return $setting->value;
                    }
                    if (file_exists(public_path($setting->value))) {
                        return asset($setting->value);
                    }
                    if (file_exists(storage_path('app/public/' . $setting->value))) {
                        return asset('storage/' . $setting->value);
                    }
                }
            }
        } catch (\Exception $e) {}

        return asset('images/logo.png');
    }
}
if (!function_exists('can')) { function can($permission) { if (!Auth::check()) return false; return Auth::user()->can($permission); } }
if (!function_exists('getPageSize')) {
    function getPageSize($request = null) {
        $req = $request instanceof \Illuminate\Http\Request ? $request : request();
        if ($req) {
            if ($req->has('page') && is_array($req->get('page')) && isset($req->get('page')['size'])) {
                return (int) $req->get('page')['size'];
            }
            if ($req->has('pageSize')) {
                return (int) $req->get('pageSize');
            }
            if ($req->has('page_size')) {
                return (int) $req->get('page_size');
            }
            if ($req->has('per_page')) {
                return (int) $req->get('per_page');
            }
            if ($req->has('limit')) {
                return (int) $req->get('limit');
            }
        }
        return 10;
    }
}
if (!function_exists('canDelete')) {
    function canDelete($models, $columnName, $id) {
        $models = is_array($models) ? $models : [$models];
        foreach ($models as $model) {
            if (class_exists($model)) {
                $result = $model::where($columnName, $id)->exists();
                if ($result) {
                    return true;
                }
            }
        }
        return false;
    }
}

if (!function_exists('getLogoBase64')) {
    function getLogoBase64() {
        try {
            $setting = Setting::where('key', 'logo')->first();
            $logoPath = public_path('images/logo.png');
            if ($setting && !empty($setting->value)) {
                $settingPath = public_path($setting->value);
                if (file_exists($settingPath)) {
                    $logoPath = $settingPath;
                }
            }
            if (file_exists($logoPath)) {
                $type = pathinfo($logoPath, PATHINFO_EXTENSION);
                $data = file_get_contents($logoPath);
                return 'data:image/' . $type . ';base64,' . base64_encode($data);
            }
        } catch (\Exception $e) {
            // fallback
        }
        return '';
    }
}

if (!function_exists('getLoginUserLanguage')) {
    function getLoginUserLanguage() {
        if (Auth::check() && Auth::user()->language) {
            return Auth::user()->language;
        }
        return 'en';
    }
}

if (!function_exists('getIndianCurrencyWords')) {
    function getIndianCurrencyWords($number) {
        $no = floor((float)$number);
        $decimal = round(((float)$number - $no) * 100);
        $digits_length = strlen((string)$no);
        $i = 0;
        $str = [];
        $words = [
            0 => '', 1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
            6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
            11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen', 15 => 'Fifteen',
            16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen', 19 => 'Nineteen', 20 => 'Twenty',
            30 => 'Thirty', 40 => 'Forty', 50 => 'Fifty', 60 => 'Sixty', 70 => 'Seventy',
            80 => 'Eighty', 90 => 'Ninety'
        ];
        $digits = ['', 'Hundred', 'Thousand', 'Lakh', 'Crore'];
        while ($i < $digits_length) {
            $divider = ($i == 2) ? 10 : 100;
            $subNum = floor($no % $divider);
            $no = floor($no / $divider);
            $i += ($divider == 10) ? 1 : 2;
            if ($subNum) {
                $counter = count($str);
                $plural = ($counter && $subNum > 9) ? 's' : null;
                $hundred = ($counter == 1 && isset($str[0]) && $str[0]) ? ' and ' : null;
                $str[] = ($subNum < 21) ? ($words[$subNum] . ' ' . ($digits[$counter] ?? '') . $plural . ' ' . $hundred)
                    : ($words[floor($subNum / 10) * 10] . ' ' . ($words[$subNum % 10] ?? '') . ' ' . ($digits[$counter] ?? '') . $plural . ' ' . $hundred);
            } else {
                $str[] = null;
            }
        }
        $rupees = trim(preg_replace('/\s+/', ' ', implode('', array_reverse(array_filter($str)))));
        $paise = ($decimal > 0) ? (' and ' . ($words[floor($decimal / 10) * 10] ?? '') . ' ' . ($words[$decimal % 10] ?? '') . ' Paise') : '';
        if (empty($rupees) && empty($paise)) {
            return 'Zero Rupees Only';
        }
        return trim(($rupees ? $rupees . ' Rupees' : '') . $paise) . ' Only';
    }
}