<?php

use App\Http\Controllers\MasterData\StoreController;
use App\Http\Controllers\MasterData\CategoryController;
use App\Http\Controllers\MasterData\ProductController;
use App\Http\Controllers\MasterData\SupplierController;
use App\Http\Controllers\MasterData\CustomerController;
use App\Http\Controllers\MasterData\CustomerDiscountController;
use App\Http\Controllers\MasterData\UserStoreController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // Store Management
    Route::get('master-data/stores', [StoreController::class, 'index'])->name('master-data.stores.index')->middleware('permission:store.view');
    Route::get('master-data/stores/create', [StoreController::class, 'create'])->name('master-data.stores.create')->middleware('permission:store.create');
    Route::post('master-data/stores', [StoreController::class, 'store'])->name('master-data.stores.store')->middleware('permission:store.create');
    Route::get('master-data/stores/{store}', [StoreController::class, 'show'])->name('master-data.stores.show')->middleware('permission:store.view');
    Route::get('master-data/stores/{store}/edit', [StoreController::class, 'edit'])->name('master-data.stores.edit')->middleware('permission:store.edit');
    Route::put('master-data/stores/{store}', [StoreController::class, 'update'])->name('master-data.stores.update')->middleware('permission:store.edit');
    Route::delete('master-data/stores/{store}', [StoreController::class, 'destroy'])->name('master-data.stores.destroy')->middleware('permission:store.delete');
    
    // Store User Assignment
    Route::post('master-data/stores/{store}/assign-users', [UserStoreController::class, 'assignUsers'])->name('master-data.stores.assign-users')->middleware('permission:store.edit');
    Route::delete('master-data/stores/{store}/remove-user/{user}', [UserStoreController::class, 'removeUser'])->name('master-data.stores.remove-user')->middleware('permission:store.edit');
    Route::get('master-data/stores/{store}/unassigned-users', [UserStoreController::class, 'getUnassignedUsers'])->name('master-data.stores.unassigned-users')->middleware('permission:store.view');

    // Category Management
    Route::get('master-data/categories', [CategoryController::class, 'index'])->name('master-data.categories.index')->middleware('permission:category.view');
    Route::get('master-data/categories/create', [CategoryController::class, 'create'])->name('master-data.categories.create')->middleware('permission:category.create');
    Route::post('master-data/categories', [CategoryController::class, 'store'])->name('master-data.categories.store')->middleware('permission:category.create');
    Route::get('master-data/categories/{category}', [CategoryController::class, 'show'])->name('master-data.categories.show')->middleware('permission:category.view');
    Route::get('master-data/categories/{category}/edit', [CategoryController::class, 'edit'])->name('master-data.categories.edit')->middleware('permission:category.edit');
    Route::put('master-data/categories/{category}', [CategoryController::class, 'update'])->name('master-data.categories.update')->middleware('permission:category.edit');
    Route::delete('master-data/categories/{category}', [CategoryController::class, 'destroy'])->name('master-data.categories.destroy')->middleware('permission:category.delete');

    // Product Management
    Route::get('master-data/products', [ProductController::class, 'index'])->name('master-data.products.index')->middleware('permission:product.view');
    Route::get('master-data/products/create', [ProductController::class, 'create'])->name('master-data.products.create')->middleware('permission:product.create');
    Route::post('master-data/products', [ProductController::class, 'store'])->name('master-data.products.store')->middleware('permission:product.create');
    Route::get('master-data/products/{product}', [ProductController::class, 'show'])->name('master-data.products.show')->middleware('permission:product.view');
    Route::get('master-data/products/{product}/edit', [ProductController::class, 'edit'])->name('master-data.products.edit')->middleware('permission:product.edit');
    Route::put('master-data/products/{product}', [ProductController::class, 'update'])->name('master-data.products.update')->middleware('permission:product.edit');
    Route::delete('master-data/products/{product}', [ProductController::class, 'destroy'])->name('master-data.products.destroy')->middleware('permission:product.delete');

    // Supplier Management
    Route::get('master-data/suppliers', [SupplierController::class, 'index'])->name('master-data.suppliers.index')->middleware('permission:supplier.view');
    Route::get('master-data/suppliers/create', [SupplierController::class, 'create'])->name('master-data.suppliers.create')->middleware('permission:supplier.create');
    Route::post('master-data/suppliers', [SupplierController::class, 'store'])->name('master-data.suppliers.store')->middleware('permission:supplier.create');
    Route::get('master-data/suppliers/{supplier}', [SupplierController::class, 'show'])->name('master-data.suppliers.show')->middleware('permission:supplier.view');
    Route::get('master-data/suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('master-data.suppliers.edit')->middleware('permission:supplier.edit');
    Route::put('master-data/suppliers/{supplier}', [SupplierController::class, 'update'])->name('master-data.suppliers.update')->middleware('permission:supplier.edit');
    Route::delete('master-data/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('master-data.suppliers.destroy')->middleware('permission:supplier.delete');

    // Customer Management
    Route::get('master-data/customers', [CustomerController::class, 'index'])->name('master-data.customers.index')->middleware('permission:customer.view');
    Route::get('master-data/customers/create', [CustomerController::class, 'create'])->name('master-data.customers.create')->middleware('permission:customer.create');
    Route::post('master-data/customers', [CustomerController::class, 'store'])->name('master-data.customers.store')->middleware('permission:customer.create');
    Route::get('master-data/customers/{customer}', [CustomerController::class, 'show'])->name('master-data.customers.show')->middleware('permission:customer.view');
    Route::get('master-data/customers/{customer}/edit', [CustomerController::class, 'edit'])->name('master-data.customers.edit')->middleware('permission:customer.edit');
    Route::put('master-data/customers/{customer}', [CustomerController::class, 'update'])->name('master-data.customers.update')->middleware('permission:customer.edit');
    Route::delete('master-data/customers/{customer}', [CustomerController::class, 'destroy'])->name('master-data.customers.destroy')->middleware('permission:customer.delete');
    Route::patch('master-data/customers/{customer}/toggle-status', [CustomerController::class, 'toggleStatus'])->name('master-data.customers.toggle-status')->middleware('permission:customer.edit');
    
    // Customer Discount Management (Jenis Member)
    Route::get('master-data/customer-discounts', [CustomerDiscountController::class, 'index'])->name('master-data.customer-discounts.index')->middleware('permission:customer-discount.view');
    Route::get('master-data/customer-discounts/create', [CustomerDiscountController::class, 'create'])->name('master-data.customer-discounts.create')->middleware('permission:customer-discount.create');
    Route::post('master-data/customer-discounts', [CustomerDiscountController::class, 'store'])->name('master-data.customer-discounts.store')->middleware('permission:customer-discount.create');
    Route::get('master-data/customer-discounts/{customerDiscount}', [CustomerDiscountController::class, 'show'])->name('master-data.customer-discounts.show')->middleware('permission:customer-discount.view');
    Route::get('master-data/customer-discounts/{customerDiscount}/edit', [CustomerDiscountController::class, 'edit'])->name('master-data.customer-discounts.edit')->middleware('permission:customer-discount.edit');
    Route::put('master-data/customer-discounts/{customerDiscount}', [CustomerDiscountController::class, 'update'])->name('master-data.customer-discounts.update')->middleware('permission:customer-discount.edit');
    Route::delete('master-data/customer-discounts/{customerDiscount}', [CustomerDiscountController::class, 'destroy'])->name('master-data.customer-discounts.destroy')->middleware('permission:customer-discount.delete');
    Route::patch('master-data/customer-discounts/{customerDiscount}/toggle-status', [CustomerDiscountController::class, 'toggleStatus'])->name('master-data.customer-discounts.toggle-status')->middleware('permission:customer-discount.edit');
    
    // Customer API for search
    Route::get('api/customers/search', [CustomerController::class, 'search'])->name('api.customers.search');
});
