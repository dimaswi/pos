<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\Store;
use App\Models\Product;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $stores = Store::all();
        $products = Product::all();

        // Create inventory for each product in each store
        foreach ($stores as $store) {
            foreach ($products as $product) {
                $quantity = rand(0, 100);
                $minimumStock = rand(5, 20);
                $cost = $product->price * 0.7; // Assume cost is 70% of selling price

                Inventory::create([
                    'store_id' => $store->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'minimum_stock' => $minimumStock,
                    'maximum_stock' => $minimumStock * 5,
                    'average_cost' => $cost,
                    'last_cost' => $cost + rand(-10000, 10000),
                    'location' => 'Rak ' . chr(65 + rand(0, 4)) . '-' . rand(1, 10),
                    'last_restock_date' => now()->subDays(rand(1, 30)),
                ]);
            }
        }
    }
}
