<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Store;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MinimumStockAlertController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::with(['product.category', 'store'])
            ->whereRaw('quantity <= minimum_stock')
            ->where('minimum_stock', '>', 0);

        // Apply filters
        if ($request->filled('search')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%")
                  ->orWhere('barcode', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->filled('category_id')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        if ($request->filled('alert_level')) {
            switch ($request->alert_level) {
                case 'critical':
                    $query->whereRaw('quantity = 0');
                    break;
                case 'warning':
                    $query->whereRaw('quantity > 0 AND quantity <= minimum_stock');
                    break;
                case 'low':
                    $query->whereRaw('quantity <= (minimum_stock * 1.5) AND quantity > minimum_stock');
                    break;
            }
        }

        $alerts = $query->orderByRaw('
            CASE 
                WHEN quantity = 0 THEN 1
                WHEN quantity <= minimum_stock THEN 2
                ELSE 3
            END
        ')
        ->orderBy('quantity', 'asc')
        ->paginate($request->get('perPage', 15))
        ->withQueryString();

        // Add alert level to each item
        $alerts->getCollection()->transform(function ($inventory) {
            // Add current_stock as alias for quantity for frontend compatibility
            $inventory->current_stock = $inventory->quantity;
            
            // Calculate shortage
            $shortage = max(0, $inventory->minimum_stock - $inventory->quantity);
            $inventory->shortage = $shortage;
            $inventory->stock_difference = $shortage; // Legacy field name
            
            // Set alert level and status
            if ($inventory->quantity == 0) {
                $inventory->alert_level = 'critical';
                $inventory->alert_text = 'Stok Habis';
                $inventory->alert_color = 'red';
                $inventory->status = 'critical';
            } elseif ($inventory->quantity <= $inventory->minimum_stock) {
                $inventory->alert_level = 'warning';
                $inventory->alert_text = 'Stok Minimum';
                $inventory->alert_color = 'orange';
                $inventory->status = 'warning';
            } else {
                $inventory->alert_level = 'low';
                $inventory->alert_text = 'Stok Rendah';
                $inventory->alert_color = 'yellow';
                $inventory->status = 'low';
            }
            
            // Calculate estimated value (shortage * purchase_price)
            $estimatedValue = $shortage * ($inventory->product->purchase_price ?? 0);
            $inventory->estimated_value = $estimatedValue;
            
            // Add price field to product for frontend compatibility
            if ($inventory->product) {
                $inventory->product->price = $inventory->product->purchase_price;
            }
            
            // Format last updated
            $inventory->last_updated = $inventory->updated_at->format('Y-m-d H:i:s');
            
            return $inventory;
        });

        $stores = Store::orderBy('name')->get();
        $categories = Category::orderBy('name')->get();

        // Statistics
        $stats = [
            'total_alerts' => Inventory::whereRaw('quantity <= minimum_stock')
                ->where('minimum_stock', '>', 0)
                ->count(),
            'critical_alerts' => Inventory::whereRaw('quantity = 0')
                ->where('minimum_stock', '>', 0)
                ->count(),
            'warning_alerts' => Inventory::whereRaw('quantity > 0 AND quantity <= minimum_stock')
                ->where('minimum_stock', '>', 0)
                ->count(),
            'stores_affected' => Inventory::whereRaw('quantity <= minimum_stock')
                ->where('minimum_stock', '>', 0)
                ->distinct()
                ->count('store_id'),
        ];

        return Inertia::render('inventory/stock-alerts/index', [
            'alerts' => $alerts,
            'stores' => $stores,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'store_id', 'category_id', 'alert_level', 'perPage']),
            'debug' => [
                'total_inventory' => Inventory::count(),
                'alerts_count' => $alerts->total(),
                'sample_alert' => $alerts->items() ? $alerts->items()[0] ?? null : null,
            ]
        ]);
    }

    public function updateMinimumStock(Request $request)
    {
        $request->validate([
            'inventory_id' => 'required|exists:inventories,id',
            'minimum_stock' => 'required|integer|min:0',
        ]);

        $inventory = Inventory::findOrFail($request->inventory_id);
        $inventory->update(['minimum_stock' => $request->minimum_stock]);

        return back()->with('success', 'Minimum stock berhasil diupdate.');
    }

    public function bulkUpdateMinimumStock(Request $request)
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.inventory_id' => 'required|exists:inventories,id',
            'updates.*.minimum_stock' => 'required|integer|min:0',
        ]);

        foreach ($request->updates as $update) {
            $inventory = Inventory::find($update['inventory_id']);
            if ($inventory) {
                $inventory->update(['minimum_stock' => $update['minimum_stock']]);
            }
        }

        return back()->with('success', count($request->updates) . ' minimum stock berhasil diupdate.');
    }

    public function export(Request $request)
    {
        $query = Inventory::with(['product.category', 'store'])
            ->whereRaw('quantity <= minimum_stock')
            ->where('minimum_stock', '>', 0);

        // Apply same filters as index
        if ($request->filled('search')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%")
                  ->orWhere('barcode', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->filled('category_id')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        $alerts = $query->orderByRaw('
            CASE 
                WHEN quantity = 0 THEN 1
                WHEN quantity <= minimum_stock THEN 2
                ELSE 3
            END
        ')->get();

        // Transform data for export
        $exportData = $alerts->map(function ($inventory) {
            $alertLevel = 'Low Stock';
            if ($inventory->quantity == 0) {
                $alertLevel = 'Out of Stock';
            } elseif ($inventory->quantity <= $inventory->minimum_stock) {
                $alertLevel = 'Below Minimum';
            }

            return [
                'Store' => $inventory->store->name,
                'Product Name' => $inventory->product->name,
                'SKU' => $inventory->product->sku,
                'Category' => $inventory->product->category->name,
                'Current Stock' => $inventory->quantity,
                'Minimum Stock' => $inventory->minimum_stock,
                'Shortage' => max(0, $inventory->minimum_stock - $inventory->quantity),
                'Alert Level' => $alertLevel,
                'Last Updated' => $inventory->updated_at->format('Y-m-d H:i:s'),
            ];
        });

        $filename = 'minimum_stock_alerts_' . now()->format('Y_m_d_H_i_s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ];

        $callback = function() use ($exportData) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fwrite($file, "\xEF\xBB\xBF");
            
            // Write headers
            if ($exportData->count() > 0) {
                fputcsv($file, array_keys($exportData->first()));
            }
            
            // Write data
            foreach ($exportData as $row) {
                fputcsv($file, $row);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function getAlertCounts()
    {
        $counts = [
            'total' => Inventory::whereRaw('quantity <= minimum_stock')
                ->where('minimum_stock', '>', 0)
                ->count(),
            'critical' => Inventory::whereRaw('quantity = 0')
                ->where('minimum_stock', '>', 0)
                ->count(),
            'warning' => Inventory::whereRaw('quantity > 0 AND quantity <= minimum_stock')
                ->where('minimum_stock', '>', 0)
                ->count(),
        ];

        return response()->json($counts);
    }
}
