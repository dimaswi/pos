<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $isActive = $request->get('is_active', '');

        $stores = Store::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($isActive !== '', function ($query) use ($isActive) {
                return $query->where('is_active', (bool) $isActive);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('master-data/store/index', [
            'stores' => $stores,
            'filters' => [
                'search' => $search,
                'is_active' => $isActive,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $allUsers = User::with('role:id,name')
            ->select('users.id', 'users.name', 'users.nip', 'users.role_id')
            ->get();

        return Inertia::render('master-data/store/create', [
            'allUsers' => $allUsers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20|unique:stores,code',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
            'user_ids' => 'array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $data = $request->only(['code', 'name', 'address', 'phone', 'email']);
        
        // Set default values for required fields
        $data['timezone'] = 'Asia/Jakarta';
        $data['currency'] = 'IDR';
        $data['tax_rate'] = 0;
        $data['is_active'] = $request->boolean('is_active', true);

        $store = Store::create($data);
        
        // Assign users to store if provided
        if ($request->has('user_ids') && is_array($request->user_ids)) {
            $store->users()->attach($request->user_ids);
        }

        return redirect()->route('master-data.stores.index')
            ->with('success', 'Store berhasil ditambahkan');
    }

    public function show(Store $store)
    {
        $store->load(['users' => function($query) {
            $query->select('users.id', 'users.name', 'users.nip', 'users.role_id')
                  ->with('role:id,name');
        }]);
        
        $allUsers = User::with('role:id,name')
            ->select('users.id', 'users.name', 'users.nip', 'users.role_id')
            ->get();

        return Inertia::render('master-data/store/show', [
            'store' => $store,
            'allUsers' => $allUsers
        ]);
    }

    public function edit(Store $store)
    {
        $store->load(['users' => function($query) {
            $query->select('users.id', 'users.name', 'users.nip', 'users.role_id')
                  ->with('role:id,name');
        }]);
        
        $allUsers = User::with('role:id,name')
            ->select('users.id', 'users.name', 'users.nip', 'users.role_id')
            ->get();

        return Inertia::render('master-data/store/edit', [
            'store' => $store,
            'allUsers' => $allUsers
        ]);
    }

    public function update(Request $request, Store $store)
    {
        $request->validate([
            'code' => 'required|string|max:20|unique:stores,code,' . $store->id,
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
            'user_ids' => 'array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $data = $request->only(['code', 'name', 'address', 'phone', 'email']);
        $data['is_active'] = $request->boolean('is_active', true);

        $store->update($data);
        
        // Update user assignments if provided
        if ($request->has('user_ids') && is_array($request->user_ids)) {
            $store->users()->sync($request->user_ids);
        }

        return redirect()->route('master-data.stores.index')
            ->with('success', 'Store berhasil diupdate');
    }

    public function destroy(Store $store)
    {
        // Check if store has users
        if ($store->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Store tidak dapat dihapus karena masih memiliki user');
        }

        $store->delete();

        return redirect()->route('master-data.stores.index')
            ->with('success', 'Store berhasil dihapus');
    }
}
