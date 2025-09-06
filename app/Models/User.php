<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'nip',
        'password',
        'role_id',
        'current_store_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function hasPermission($permission): bool
    {
        return $this->role?->hasPermission($permission) ?? false;
    }

    public function hasRole($role): bool
    {
        if (is_string($role)) {
            return $this->role?->name === $role;
        }
        
        return $this->role?->id === $role->id;
    }

    public function getAllPermissions()
    {
        return $this->role?->permissions ?? collect();
    }

    public function getAllPermissionNames(): array
    {
        return $this->role?->permissions?->pluck('name')->toArray() ?? [];
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    // Store relationships
    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class, 'user_stores')
                    ->withPivot(['is_default'])
                    ->withTimestamps();
    }

    public function currentStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'current_store_id');
    }

    public function getDefaultStoreAttribute()
    {
        return $this->stores()->wherePivot('is_default', true)->first();
    }

    public function hasAccessToStore($storeId): bool
    {
        return $this->stores()->where('stores.id', $storeId)->exists();
    }
}
