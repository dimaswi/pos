<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $isActive = $request->get('is_active', '');

        $suppliers = Supplier::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($isActive !== '', function ($query) use ($isActive) {
                return $query->where('is_active', (bool) $isActive);
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('master-data/supplier/index', [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'is_active' => $isActive,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('master-data/supplier/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:suppliers,code',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'tax_number' => 'nullable|string|max:50',
            'payment_term' => 'nullable|in:cash,credit_7,credit_14,credit_30,credit_60',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        Supplier::create($request->all());

        return redirect()->route('master-data.suppliers.index')
            ->with('success', 'Supplier created successfully.');
    }

    public function show(Supplier $supplier)
    {
        $supplier->loadCount('products');

        return Inertia::render('master-data/supplier/show', [
            'supplier' => $supplier
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('master-data/supplier/edit', [
            'supplier' => $supplier
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:suppliers,code,' . $supplier->id,
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'tax_number' => 'nullable|string|max:50',
            'payment_term' => 'nullable|in:cash,credit_7,credit_14,credit_30,credit_60',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $supplier->update($request->all());

        return redirect()->route('master-data.suppliers.index')
            ->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->products()->count() > 0) {
            return back()->with('error', 'Cannot delete supplier with products.');
        }

        $supplier->delete();

        return redirect()->route('master-data.suppliers.index')
            ->with('success', 'Supplier deleted successfully.');
    }
}
