<?php

namespace Database\Seeders;

use App\Models\CustomerDiscount;
use Illuminate\Database\Seeder;

class CustomerDiscountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $discounts = [
            [
                'customer_type' => 'regular',
                'name' => 'Diskon Pelanggan Reguler',
                'discount_percentage' => 0.00,
                'minimum_purchase' => 0.00,
                'maximum_discount' => null,
                'is_active' => true,
                'description' => 'Tidak ada diskon untuk pelanggan reguler',
            ],
            [
                'customer_type' => 'member',
                'name' => 'Diskon Member',
                'discount_percentage' => 5.00,
                'minimum_purchase' => 50000.00,
                'maximum_discount' => 100000.00,
                'is_active' => true,
                'description' => 'Diskon 5% untuk member dengan minimal pembelian Rp 50.000',
            ],
            [
                'customer_type' => 'vip',
                'name' => 'Diskon VIP',
                'discount_percentage' => 10.00,
                'minimum_purchase' => 100000.00,
                'maximum_discount' => 500000.00,
                'is_active' => true,
                'description' => 'Diskon 10% untuk VIP dengan minimal pembelian Rp 100.000',
            ],
        ];

        foreach ($discounts as $discount) {
            CustomerDiscount::updateOrCreate(
                ['customer_type' => $discount['customer_type']],
                $discount
            );
        }
    }
}
