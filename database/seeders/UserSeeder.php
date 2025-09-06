<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roleAdmin = Role::where('name', 'admin')->first();

        User::create([
            'name' => 'Admin',
            'nip' => 'admin',
            'password' => bcrypt('12345'),
            'role_id' => $roleAdmin->id
        ]);
    }
}
