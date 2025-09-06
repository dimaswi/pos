<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $query = Discount::query()->with(['store']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by store
        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true)
                      ->where('start_date', '<=', now())
                      ->where(function ($q) {
                          $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', now());
                      });
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($request->status === 'expired') {
                $query->where('end_date', '<', now());
            }
        }

        $discounts = $query->orderBy('created_at', 'desc')
                          ->paginate($request->get('perPage', 15))
                          ->withQueryString();

        // Usage count is already maintained in the database table
        // No need to calculate it here as it's automatically updated when transactions are created/voided

        // Get statistics
        $stats = [
            'total_discounts' => Discount::count(),
            'active_discounts' => Discount::where('is_active', true)
                                         ->where('start_date', '<=', now())
                                         ->where(function ($q) {
                                             $q->whereNull('end_date')
                                               ->orWhere('end_date', '>=', now());
                                         })->count(),
            'expired_discounts' => Discount::where('end_date', '<', now())->count(),
            'total_usage' => Discount::sum('usage_count'), // Use the maintained usage_count column
        ];

        $stores = Store::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sales/discounts/index', [
            'discounts' => $discounts,
            'stores' => $stores,
            'stats' => $stats,
            'filters' => $request->only(['search', 'store_id', 'type', 'status', 'perPage']),
        ]);
    }

    public function create()
    {
        $stores = Store::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sales/discounts/create', [
            'stores' => $stores,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:discounts,code',
            'type' => 'required|in:percentage,fixed,buy_x_get_y',
            'value' => 'required|numeric|min:0',
            'store_id' => 'nullable|exists:stores,id',
            'description' => 'nullable|string|max:1000',
            'minimum_amount' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_active' => 'boolean',
            'apply_to_sale_items' => 'boolean',
            'minimum_quantity' => 'nullable|integer|min:1',
            'get_quantity' => 'nullable|integer|min:1',
        ]);

        $discount = Discount::create([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'store_id' => $request->store_id,
            'description' => $request->description,
            'minimum_amount' => $request->minimum_amount,
            'maximum_discount' => $request->maximum_discount,
            'usage_limit' => $request->usage_limit,
            'usage_limit_per_customer' => $request->usage_limit_per_customer,
            'usage_count' => 0,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->boolean('is_active', true),
            'apply_to_sale_items' => $request->boolean('apply_to_sale_items', false),
            'minimum_quantity' => $request->minimum_quantity,
            'get_quantity' => $request->get_quantity,
        ]);

        return redirect()->route('sales.discounts.index')
                        ->with('success', 'Discount created successfully.');
    }

    public function show(Discount $discount)
    {
        $discount->load(['store', 'salesTransactions' => function ($query) {
            $query->with(['store', 'customer'])
                  ->where('status', 'completed') // Only count completed transactions
                  ->orderBy('created_at', 'desc')
                  ->limit(10);
        }]);

        // Calculate usage statistics from the maintained usage_count and only completed transactions
        $usageStats = [
            'total_usage' => $discount->usage_count, // Use the maintained count
            'total_discount_amount' => $discount->salesTransactions()
                                               ->where('status', 'completed')
                                               ->sum('discount_amount'),
            'this_month_usage' => $discount->salesTransactions()
                                         ->where('status', 'completed')
                                         ->whereMonth('created_at', now()->month)
                                         ->whereYear('created_at', now()->year)
                                         ->count(),
            'this_month_discount_amount' => $discount->salesTransactions()
                                                   ->where('status', 'completed')
                                                   ->whereMonth('created_at', now()->month)
                                                   ->whereYear('created_at', now()->year)
                                                   ->sum('discount_amount'),
        ];

        $discount->usage_stats = $usageStats;

        return Inertia::render('sales/discounts/show', [
            'discount' => $discount,
        ]);
    }

    public function edit(Discount $discount)
    {
        $stores = Store::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sales/discounts/edit', [
            'discount' => $discount,
            'stores' => $stores,
        ]);
    }

    public function update(Request $request, Discount $discount)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:50', Rule::unique('discounts', 'code')->ignore($discount->id)],
            'type' => 'required|in:percentage,fixed,buy_x_get_y',
            'value' => 'required|numeric|min:0',
            'store_id' => 'nullable|exists:stores,id',
            'description' => 'nullable|string|max:1000',
            'minimum_amount' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_active' => 'boolean',
            'apply_to_sale_items' => 'boolean',
            'minimum_quantity' => 'nullable|integer|min:1',
            'get_quantity' => 'nullable|integer|min:1',
        ]);

        $discount->update([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'store_id' => $request->store_id,
            'description' => $request->description,
            'minimum_amount' => $request->minimum_amount,
            'maximum_discount' => $request->maximum_discount,
            'usage_limit' => $request->usage_limit,
            'usage_limit_per_customer' => $request->usage_limit_per_customer,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->boolean('is_active', true),
            'apply_to_sale_items' => $request->boolean('apply_to_sale_items', false),
            'minimum_quantity' => $request->minimum_quantity,
            'get_quantity' => $request->get_quantity,
        ]);

        return redirect()->route('sales.discounts.index')
                        ->with('success', 'Discount updated successfully.');
    }

    public function destroy(Discount $discount)
    {
        // Check if discount has been used
        if ($discount->salesTransactions()->count() > 0) {
            return back()->with('error', 'Cannot delete discount that has been used in transactions.');
        }

        $discount->delete();

        return redirect()->route('sales.discounts.index')
                        ->with('success', 'Discount deleted successfully.');
    }

    public function toggleStatus(Discount $discount)
    {
        $discount->update([
            'is_active' => !$discount->is_active
        ]);

        $status = $discount->is_active ? 'activated' : 'deactivated';
        
        return back()->with('success', "Discount {$status} successfully.");
    }

    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'store_id' => 'nullable|exists:stores,id',
            'total_amount' => 'required|numeric|min:0',
        ]);

        $discount = Discount::where('code', strtoupper($request->code))
                           ->where('is_active', true)
                           ->where('start_date', '<=', now())
                           ->where(function ($q) {
                               $q->whereNull('end_date')
                                 ->orWhere('end_date', '>=', now());
                           })
                           ->when($request->store_id, function ($q) use ($request) {
                               $q->where(function ($sq) use ($request) {
                                   $sq->whereNull('store_id')
                                      ->orWhere('store_id', $request->store_id);
                               });
                           })
                           ->first();

        if (!$discount) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or expired discount code.'
            ]);
        }

        // Check minimum amount
        if ($discount->minimum_amount && $request->total_amount < $discount->minimum_amount) {
            return response()->json([
                'valid' => false,
                'message' => "Minimum purchase amount is " . number_format($discount->minimum_amount)
            ]);
        }

        // Check usage limit
        if ($discount->usage_limit && $discount->usage_count >= $discount->usage_limit) {
            return response()->json([
                'valid' => false,
                'message' => 'Discount usage limit exceeded.'
            ]);
        }

        // Calculate discount amount
        $discountAmount = 0;
        if ($discount->type === 'percentage') {
            $discountAmount = $request->total_amount * ($discount->value / 100);
        } elseif ($discount->type === 'fixed') {
            $discountAmount = $discount->value;
        }

        // Apply maximum discount limit
        if ($discount->maximum_discount && $discountAmount > $discount->maximum_discount) {
            $discountAmount = $discount->maximum_discount;
        }

        return response()->json([
            'valid' => true,
            'discount' => $discount,
            'discount_amount' => $discountAmount,
            'message' => 'Discount code applied successfully.'
        ]);
    }
}
