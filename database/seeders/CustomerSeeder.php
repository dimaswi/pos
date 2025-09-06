<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'code' => 'REG20250831001',
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'phone' => '08123456789',
                'address' => 'Jl. Merdeka No. 123, Jakarta',
                'customer_type' => 'regular',
                'is_active' => true,
            ],
            [
                'code' => 'MBR20250831001',
                'name' => 'Siti Nurhaliza',
                'email' => 'siti@example.com',
                'phone' => '08234567890',
                'address' => 'Jl. Sudirman No. 456, Bandung',
                'customer_type' => 'member',
                'is_active' => true,
            ],
            [
                'code' => 'VIP20250831001',
                'name' => 'Ahmad Yani',
                'email' => 'ahmad@example.com',
                'phone' => '08345678901',
                'address' => 'Jl. Gatot Subroto No. 789, Surabaya',
                'customer_type' => 'vip',
                'is_active' => true,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}
