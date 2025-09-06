<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Console\Command;

class FixAverageCost extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:fix-average-cost 
                            {--product-id= : Fix specific product ID}
                            {--store-id= : Fix specific store ID}
                            {--all : Fix all products}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix and recalculate average cost for products based on purchase history';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $inventoryService = new InventoryService();
        
        $productId = $this->option('product-id');
        $storeId = $this->option('store-id');
        $all = $this->option('all');

        if ($productId) {
            $product = Product::find($productId);
            if (!$product) {
                $this->error("Product with ID {$productId} not found");
                return 1;
            }

            $this->info("Fixing average cost for product: {$product->name}");
            $inventoryService->updateAverageCostAllStores($product);
            $this->info("Average cost updated for product: {$product->name}");
            
        } elseif ($storeId) {
            $this->info("Fixing average cost for all products in store ID: {$storeId}");
            $inventoryService->recalculateAverageCostForStore($storeId);
            $this->info("Average cost updated for all products in store ID: {$storeId}");
            
        } elseif ($all) {
            $this->info("Fixing average cost for all products...");
            
            $products = Product::with('inventories')->get();
            $bar = $this->output->createProgressBar($products->count());
            $bar->start();

            foreach ($products as $product) {
                $inventoryService->updateAverageCostAllStores($product);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Average cost updated for all products");
            
        } else {
            $this->error('Please specify --product-id, --store-id, or --all option');
            return 1;
        }

        return 0;
    }
}
