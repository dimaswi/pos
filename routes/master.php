<?php

use App\Http\Controllers\Master\RoleController;
use App\Http\Controllers\Master\UserController;
use App\Http\Controllers\Master\PermissionController;
use App\Http\Controllers\Master\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // User Management
    Route::get('settings/users', [UserController::class, 'index'])->name('users.index')->middleware('permission:user.view');
    Route::get('settings/users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:user.create');
    Route::post('settings/users', [UserController::class, 'store'])->name('users.store')->middleware('permission:user.create');
    Route::get('settings/users/{user}', [UserController::class,'edit'])->name('users.edit')->middleware('permission:user.edit');
    Route::put('settings/users/{user}', [UserController::class,'update'])->name('users.update')->middleware('permission:user.edit');
    Route::delete('settings/users/{user}', [UserController::class,'destroy'])->name('users.destroy')->middleware('permission:user.delete');
    
    // Role Management
    Route::get('settings/roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:role.view');
    Route::get('settings/roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('permission:role.create');
    Route::post('settings/roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:role.create');
    Route::get('settings/roles/{role}', [RoleController::class, 'edit'])->name('roles.edit')->middleware('permission:role.edit');
    Route::put('settings/roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:role.edit');
    Route::delete('settings/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:role.delete');

    // Permission Management
    Route::get('settings/permissions', [PermissionController::class, 'index'])->name('permissions.index')->middleware('permission:permission.view');
    Route::get('settings/permissions/create', [PermissionController::class, 'create'])->name('permissions.create')->middleware('permission:permission.create');
    Route::post('settings/permissions', [PermissionController::class, 'store'])->name('permissions.store')->middleware('permission:permission.create');
    Route::get('settings/permissions/{permission}', [PermissionController::class, 'edit'])->name('permissions.edit')->middleware('permission:permission.edit');
    Route::put('settings/permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update')->middleware('permission:permission.edit');
    Route::delete('settings/permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy')->middleware('permission:permission.delete');
});
