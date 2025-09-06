<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    public static function get($key, $default = null)
    {
        return Cache::remember("setting.{$key}", 3600, function () use ($key, $default) {
            return Setting::get($key, $default);
        });
    }

    public static function set($key, $value, $type = 'text', $description = null)
    {
        $setting = Setting::set($key, $value, $type, $description);
        Cache::forget("setting.{$key}");
        // Also clear the app settings cache
        Cache::forget('app_settings');
        return $setting;
    }

    public static function getAppSettings()
    {
        return Cache::remember('app_settings', 3600, function () {
            return [
                'app_name' => Setting::get('app_name', 'Akuntansi'),
                'app_logo' => Setting::get('app_logo', '/1.png'),
                'app_favicon' => Setting::get('app_favicon', '/favicon.ico'),
            ];
        });
    }
}
