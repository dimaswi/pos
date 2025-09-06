<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\CustomerDiscount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerDiscountController extends Controller
{
    public function index()
    {
        $customerDiscounts = CustomerDiscount::orderBy('name')
            ->paginate(10);

        return Inertia::render('master-data/customer-discount/index', [
            'customerDiscounts' => $customerDiscounts,
        ]);
    }

    public function create()
    {
        return Inertia::render('master-data/customer-discount/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'minimum_purchase' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        CustomerDiscount::create([
            'name' => $request->name,
            'discount_percentage' => $request->discount_percentage,
            'minimum_purchase' => $request->minimum_purchase ?? 0,
            'maximum_discount' => $request->maximum_discount,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('master-data.customer-discounts.index')
            ->with('success', 'Jenis member berhasil dibuat.');
    }

    public function show(CustomerDiscount $customerDiscount)
    {
        return Inertia::render('master-data/customer-discount/show', [
            'customerDiscount' => $customerDiscount,
        ]);
    }

    public function edit(CustomerDiscount $customerDiscount)
    {
        return Inertia::render('master-data/customer-discount/edit', [
            'customerDiscount' => $customerDiscount,
        ]);
    }

    public function update(Request $request, CustomerDiscount $customerDiscount)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'minimum_purchase' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $customerDiscount->update([
            'name' => $request->name,
            'discount_percentage' => $request->discount_percentage,
            'minimum_purchase' => $request->minimum_purchase ?? 0,
            'maximum_discount' => $request->maximum_discount,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('master-data.customer-discounts.index')
            ->with('success', 'Jenis member berhasil diperbarui.');
    }

    public function destroy(CustomerDiscount $customerDiscount)
    {
        $customerDiscount->delete();

        return redirect()->route('master-data.customer-discounts.index')
            ->with('success', 'Jenis member berhasil dihapus.');
    }

    public function toggleStatus(CustomerDiscount $customerDiscount)
    {
        $customerDiscount->update([
            'is_active' => !$customerDiscount->is_active,
        ]);

        $status = $customerDiscount->is_active ? 'diaktifkan' : 'dinonaktifkan';
        
        return redirect()->back()
            ->with('success', "Jenis member berhasil {$status}.");
    }
}
