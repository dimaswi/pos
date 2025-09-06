<?php

use App\Http\Controllers\Master\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // Web Application Settings Management
    Route::get('settings/web-settings', [SettingController::class, 'index'])->name('web-settings.index')->middleware('permission:settings.view');
    Route::put('settings/web-settings', [SettingController::class, 'update'])->name('web-settings.update')->middleware('permission:settings.edit');
});
