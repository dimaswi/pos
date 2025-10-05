<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $categoryId = $request->get('category_id', '');
        $supplierId = $request->get('supplier_id', '');
        $isActive = $request->get('is_active', '');

        $products = Product::with(['category', 'supplier'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->when($categoryId, function ($query, $categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->when($supplierId, function ($query, $supplierId) {
                return $query->where('supplier_id', $supplierId);
            })
            ->when($isActive !== '', function ($query) use ($isActive) {
                return $query->where('is_active', (bool) $isActive);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $categories = Category::where('is_active', true)->orderBy('name')->get();
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('master-data/product/index', [
            'products' => $products,
            'categories' => $categories,
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'supplier_id' => $supplierId,
                'is_active' => $isActive,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $categories = Category::where('is_active', true)->get();
        $suppliers = Supplier::where('is_active', true)->get();

        return Inertia::render('master-data/product/create', [
            'categories' => $categories,
            'suppliers' => $suppliers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products',
            'barcode' => 'nullable|string|max:100|unique:products',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'minimum_price' => 'nullable|numeric|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'initial_stock' => 'nullable|integer|min:0',
            'average_cost' => 'nullable|numeric|min:0',
            'unit' => 'required|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'is_track_stock' => 'boolean'
        ]);

        // Create the product
        $product = Product::create($request->except(['initial_stock', 'average_cost']));

        // If tracking stock and has initial stock, create inventory records for all stores
        if ($request->get('is_track_stock', true) && $request->get('initial_stock', 0) > 0) {
            $stores = \App\Models\Store::where('is_active', true)->get();
            $initialStock = (int) $request->get('initial_stock', 0);
            $averageCost = (float) $request->get('average_cost', $request->get('purchase_price', 0));

            foreach ($stores as $store) {
                // Create stock movement record
                \App\Models\StockMovement::create([
                    'product_id' => $product->id,
                    'store_id' => $store->id,
                    'user_id' => $request->user() ? $request->user()->id : 1, // Add the authenticated user ID or default to 1
                    'type' => 'in', // Use 'type' instead of 'movement_type'
                    'quantity' => $initialStock,
                    'quantity_change' => $initialStock, // Add quantity_change field
                    'quantity_before' => 0,
                    'quantity_after' => $initialStock,
                    'reference_type' => 'initial_stock',
                    'reference_id' => $product->id,
                    'notes' => 'Stok awal produk',
                    'movement_date' => now(),
                ]);
            }
        }

        return redirect()->route('master-data.products.index')
            ->with('success', 'Product created successfully.' . 
                ($request->get('initial_stock', 0) > 0 ? ' Inventory records created for all stores.' : ''));
    }

    public function show(Product $product)
    {
        $product->load(['category', 'supplier']);

        // Get inventory information
        $inventories = $product->inventories()->with('store')->get();
        $currentStock = $inventories->sum('quantity');
        $averageCost = $this->getAverageCost($product->id);
        $stockValue = $inventories->sum(function($inventory) {
            return $inventory->quantity * ($inventory->average_cost ?: 0);
        });

        // Get recent purchase orders
        $recentPurchases = $product->purchaseOrderItems()
            ->with(['purchaseOrder.supplier'])
            ->whereHas('purchaseOrder', function($query) {
                $query->where('status', 'completed');
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Get recent stock movements
        $recentMovements = $product->stockMovements()
            ->with('store')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('master-data/product/show', [
            'product' => $product,
            'stock' => [
                'total_quantity' => $currentStock,
                'total_value' => $stockValue,
                'inventories' => $inventories->map(function($inventory) {
                    return [
                        'store_id' => $inventory->store_id,
                        'store_name' => $inventory->store->name,
                        'quantity' => $inventory->quantity,
                        'minimum_stock' => $inventory->minimum_stock,
                        'average_cost' => $inventory->average_cost ?: 0,
                        'stock_value' => ($inventory->quantity * ($inventory->average_cost ?: 0)),
                    ];
                }),
                'average_cost' => $averageCost,
            ],
            'recent_purchases' => $recentPurchases,
            'recent_movements' => $recentMovements,
        ]);
    }

    public function edit(Product $product)
    {
        $categories = Category::where('is_active', true)->get();
        $suppliers = Supplier::where('is_active', true)->get();

        // Get current stock information
        $inventories = $product->inventories()->with('store')->get();
        $currentStock = $inventories->sum('quantity');

        // Add current stock data to product
        $productData = $product->load(['category', 'supplier']);
        $productData->current_stock = $currentStock;
        $productData->inventories = $inventories->map(function($inventory) {
            return [
                'store_id' => $inventory->store_id,
                'store_name' => $inventory->store->name,
                'quantity' => $inventory->quantity,
                'average_cost' => $inventory->average_cost,
            ];
        });

        return Inertia::render('master-data/product/edit', [
            'product' => $productData,
            'categories' => $categories,
            'suppliers' => $suppliers
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $product->id,
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'minimum_price' => 'nullable|numeric|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'is_track_stock' => 'boolean'
        ]);

        $product->update($request->all());

        return redirect()->route('master-data.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        // Check if product is used in any transactions (you may add this later)
        
        $product->delete();

        return redirect()->route('master-data.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    private function getAverageCost($productId)
    {
        // Get average from inventory records
        $averageCost = \App\Models\Inventory::where('product_id', $productId)
            ->where('quantity', '>', 0)
            ->avg('average_cost');
        
        if (!$averageCost) {
            // Fallback to product purchase price
            $product = Product::find($productId);
            return $product ? $product->purchase_price : 0;
        }
        
        return $averageCost;
    }
}
