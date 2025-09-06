<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Store;
use App\Models\Product;
use App\Models\Category;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $storeId = $request->get('store_id', '');
        $categoryId = $request->get('category_id', '');
        $stockStatus = $request->get('stock_status', '');

        $inventories = Inventory::query()
            ->with(['store', 'product.category'])
            ->when($search, function ($query, $search) {
                return $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
                })->orWhereHas('store', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($storeId, function ($query, $storeId) {
                return $query->where('store_id', $storeId);
            })
            ->when($categoryId, function ($query, $categoryId) {
                return $query->whereHas('product', function ($q) use ($categoryId) {
                    $q->where('category_id', $categoryId);
                });
            })
            ->when($stockStatus, function ($query, $stockStatus) {
                if ($stockStatus === 'out_of_stock') {
                    return $query->where('quantity', '<=', 0);
                } elseif ($stockStatus === 'low_stock') {
                    return $query->whereColumn('quantity', '<=', 'minimum_stock')
                                 ->where('quantity', '>', 0);
                } elseif ($stockStatus === 'in_stock') {
                    return $query->whereColumn('quantity', '>', 'minimum_stock');
                }
            })
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $stores = Store::where('is_active', true)->get();
        $categories = Category::where('is_active', true)->get();

        return Inertia::render('inventory/index', [
            'inventories' => $inventories,
            'stores' => $stores,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'store_id' => $storeId,
                'category_id' => $categoryId,
                'stock_status' => $stockStatus,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function show(Inventory $inventory)
    {
        $inventory->load(['store', 'product.category']);

        return Inertia::render('inventory/show', [
            'inventory' => $inventory,
        ]);
    }

    public function edit(Inventory $inventory)
    {
        $inventory->load(['store', 'product.category']);

        return Inertia::render('inventory/edit', [
            'inventory' => $inventory,
        ]);
    }

    public function update(Request $request, Inventory $inventory)
    {
        $request->validate([
            'minimum_stock' => 'required|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0|gte:minimum_stock',
            'location' => 'nullable|string|max:255',
        ]);

        $inventory->update($request->only([
            'minimum_stock',
            'maximum_stock',
            'location'
        ]));

        return redirect()
            ->route('inventory.index')
            ->with('success', 'Inventory settings updated successfully');
    }

    public function stockAdjustment(Request $request, Inventory $inventory)
    {
        $request->validate([
            'adjustment_type' => 'required|in:increase,decrease,set',
            'quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:500',
        ]);

        $oldQuantity = $inventory->quantity;
        
        switch ($request->adjustment_type) {
            case 'increase':
                $newQuantity = $oldQuantity + $request->quantity;
                break;
            case 'decrease':
                $newQuantity = max(0, $oldQuantity - $request->quantity);
                break;
            case 'set':
                $newQuantity = $request->quantity;
                break;
        }

        $inventory->update(['quantity' => $newQuantity]);

        // Log stock movement
        $inventory->product->stockMovements()->create([
            'store_id' => $inventory->store_id,
            'user_id' => Auth::id(),
            'type' => 'adjustment',
            'quantity_before' => $oldQuantity,
            'quantity_change' => $newQuantity - $oldQuantity,
            'quantity_after' => $newQuantity,
            'notes' => $request->reason,
            'movement_date' => now(),
        ]);

        return redirect()
            ->route('inventory.index')
            ->with('success', 'Stock adjusted successfully');
    }

    public function create()
    {
        $stores = Store::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with('category')->get();

        return Inertia::render('inventory/create', [
            'stores' => $stores,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0|gte:minimum_stock',
            'location' => 'nullable|string|max:255',
        ]);

        // Check if inventory already exists
        $existingInventory = Inventory::where('store_id', $request->store_id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($existingInventory) {
            return back()->withErrors(['product_id' => 'Produk sudah ada di inventaris toko ini.']);
        }

        // Create inventory
        $inventory = Inventory::create([
            'store_id' => $request->store_id,
            'product_id' => $request->product_id,
            'quantity' => $request->quantity,
            'minimum_stock' => $request->minimum_stock,
            'maximum_stock' => $request->maximum_stock,
            'location' => $request->location,
            'last_restock_date' => now()->toDateString(),
        ]);

        // Log initial stock movement
        StockMovement::create([
            'store_id' => $request->store_id,
            'product_id' => $request->product_id,
            'user_id' => Auth::id(),
            'type' => 'adjustment',
            'quantity_before' => 0,
            'quantity_change' => $request->quantity,
            'quantity_after' => $request->quantity,
            'notes' => 'Initial stock - Product added to inventory',
            'movement_date' => now(),
        ]);

        return redirect()
            ->route('inventory.index')
            ->with('success', 'Produk berhasil ditambahkan ke inventaris toko.');
    }

    public function lowStock(Request $request)
    {
        $storeId = $request->get('store_id', '');

        $lowStockItems = Inventory::query()
            ->with(['store', 'product.category'])
            ->lowStock()
            ->when($storeId, function ($query, $storeId) {
                return $query->where('store_id', $storeId);
            })
            ->orderBy('quantity', 'asc')
            ->get();

        $stores = Store::where('is_active', true)->get();

        return Inertia::render('inventory/low-stock', [
            'lowStockItems' => $lowStockItems,
            'stores' => $stores,
            'filters' => [
                'store_id' => $storeId,
            ],
        ]);
    }
}
