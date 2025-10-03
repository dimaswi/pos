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
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Attach multiple users at once (doesn't remove existing ones)
        $store->users()->attach($request->user_ids);

        $count = count($request->user_ids);
        return back()->with('success', "{$count} karyawan berhasil diassign ke toko {$store->name}.");
    }
    
    public function syncUsers(Request $request, Store $store)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Sync will replace all existing assignments
        $store->users()->sync($request->user_ids);

        $count = count($request->user_ids);
        return back()->with('success', "Berhasil menyinkronkan {$count} karyawan ke toko {$store->name}.");
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
    
    public function getAllUsers(Store $store)
    {
        $assignedUserIds = $store->users()->pluck('users.id')->toArray();
        $allUsers = User::with('role:id,name')
            ->select('users.id', 'users.name', 'users.nip', 'users.role_id')
            ->get()
            ->map(function ($user) use ($assignedUserIds) {
                $user->is_assigned = in_array($user->id, $assignedUserIds);
                return $user;
            });

        return response()->json($allUsers);
    }
    
    public function bulkAssign(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'action' => 'required|in:assign,unassign,sync'
        ]);

        $store = Store::findOrFail($request->store_id);
        $userIds = $request->user_ids;
        $action = $request->action;
        
        switch ($action) {
            case 'assign':
                // Add users without removing existing ones
                $store->users()->attach($userIds);
                $message = count($userIds) . " karyawan berhasil ditambahkan ke toko {$store->name}";
                break;
                
            case 'unassign':
                // Remove specific users
                $store->users()->detach($userIds);
                $message = count($userIds) . " karyawan berhasil dihapus dari toko {$store->name}";
                break;
                
            case 'sync':
                // Replace all assignments with new ones
                $store->users()->sync($userIds);
                $message = "Berhasil menyinkronkan " . count($userIds) . " karyawan ke toko {$store->name}";
                break;
        }

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }
}
