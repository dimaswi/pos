<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Store;
use Inertia\Inertia;

class UserStoreController extends Controller
{
    public function assignUsers(Request $request, Store $store)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $store->users()->sync($request->user_ids);

        return back()->with('success', 'Karyawan berhasil diassign ke toko.');
    }

    public function removeUser(Request $request, Store $store, User $user)
    {
        $store->users()->detach($user->id);

        return back()->with('success', 'Karyawan berhasil dihapus dari toko.');
    }

    public function getUnassignedUsers(Store $store)
    {
        $assignedUserIds = $store->users()->pluck('users.id');
        $unassignedUsers = User::with('role:id,name')
            ->whereNotIn('users.id', $assignedUserIds)
            ->select('users.id', 'users.name', 'users.nip', 'users.role_id')
            ->get();

        return response()->json($unassignedUsers);
    }
}
