<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = [
            'app_name' => SettingService::get('app_name', 'Akuntansi'),
            'app_logo' => SettingService::get('app_logo', '/1.png'),
            'app_favicon' => SettingService::get('app_favicon', '/favicon.ico'),
        ];

        return Inertia::render('master/web-settings/index', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'app_favicon' => 'nullable|image|mimes:ico,png,jpg,gif,svg|max:1024',
        ]);

        // Update app name
        SettingService::set('app_name', $request->app_name, 'text', 'Nama Aplikasi');

        // Handle logo upload
        if ($request->hasFile('app_logo')) {
            Log::info('Logo upload detected');
            
            // Delete old logo if exists
            $oldLogo = SettingService::get('app_logo');
            if ($oldLogo && $oldLogo !== '/1.png' && Storage::disk('public')->exists(str_replace('/storage/', '', $oldLogo))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $oldLogo));
            }

            // Store new logo to public disk
            $logoPath = $request->file('app_logo')->store('logos', 'public');
            $logoUrl = '/storage/' . $logoPath;
            Log::info('Logo stored at: ' . $logoUrl);
            SettingService::set('app_logo', $logoUrl, 'image', 'Logo Aplikasi');
        }

        // Handle favicon upload
        if ($request->hasFile('app_favicon')) {
            Log::info('Favicon upload detected');
            
            // Delete old favicon if exists
            $oldFavicon = SettingService::get('app_favicon');
            if ($oldFavicon && $oldFavicon !== '/favicon.ico' && Storage::disk('public')->exists(str_replace('/storage/', '', $oldFavicon))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $oldFavicon));
            }

            // Store new favicon to public disk
            $faviconPath = $request->file('app_favicon')->store('icons', 'public');
            $faviconUrl = '/storage/' . $faviconPath;
            Log::info('Favicon stored at: ' . $faviconUrl);
            SettingService::set('app_favicon', $faviconUrl, 'image', 'Favicon Aplikasi');
        }

        return redirect()->back()->with('success', 'Pengaturan berhasil disimpan');
    }
}
