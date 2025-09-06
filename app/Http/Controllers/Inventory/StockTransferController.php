<?php

namespace App\Http\Controllers\Inventory;
use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Store;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        $query = StockTransfer::with(['fromStore', 'toStore', 'createdByUser', 'items'])
            ->withCount('items');

        // Apply filters
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('from_store_id')) {
            $query->where('from_store_id', $request->from_store_id);
        }

        if ($request->filled('to_store_id')) {
            $query->where('to_store_id', $request->to_store_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Apply user store restrictions if needed
        // TODO: Add store restriction logic based on user permissions

        $transfers = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('perPage', 10))
            ->withQueryString();

        $stores = Store::orderBy('name')->get();

        return Inertia::render('inventory/stock-transfers/index', [
            'transfers' => $transfers,
            'stores' => $stores,
            'filters' => $request->only(['search', 'from_store_id', 'to_store_id', 'status', 'perPage']),
        ]);
    }

    public function create()
    {
        $stores = Store::orderBy('name')->get();
        $products = Product::with(['category', 'inventories.store'])
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/stock-transfers/create', [
            'stores' => $stores,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'from_store_id' => 'required|exists:stores,id',
            'to_store_id' => 'required|exists:stores,id|different:from_store_id',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity_requested' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ], [
            'to_store_id.different' => 'Toko tujuan harus berbeda dengan toko asal.',
            'items.required' => 'Minimal harus ada 1 item untuk ditransfer.',
            'items.*.quantity_requested.min' => 'Quantity harus minimal 1.',
        ]);

        DB::beginTransaction();
        try {
            // Create stock transfer
            $transfer = StockTransfer::create([
                'from_store_id' => $request->from_store_id,
                'to_store_id' => $request->to_store_id,
                'transfer_date' => $request->transfer_date,
                'status' => 'draft',
                'notes' => $request->notes,
                'created_by' => Auth::id(),
            ]);

            // Create transfer items
            $totalValue = 0;
            foreach ($request->items as $item) {
                // Check stock availability
                $inventory = Inventory::where('store_id', $request->from_store_id)
                    ->where('product_id', $item['product_id'])
                    ->first();

                if (!$inventory || $inventory->current_stock < $item['quantity_requested']) {
                    $product = Product::find($item['product_id']);
                    throw new \Exception("Stok tidak mencukupi untuk produk: {$product->name}");
                }

                $transferItem = StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'unit_cost' => $item['unit_cost'],
                    'notes' => $item['notes'] ?? null,
                ]);

                $totalValue += $transferItem->total_cost;
            }

            // Update total value
            $transfer->update(['total_value' => $totalValue]);

            DB::commit();

            return redirect()->route('inventory.stock-transfers.show', $transfer)
                ->with('success', 'Stock Transfer berhasil dibuat.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function show(StockTransfer $stockTransfer)
    {
        $stockTransfer->load([
            'fromStore',
            'toStore', 
            'createdByUser',
            'approvedByUser',
            'receivedByUser',
            'items.product.category'
        ]);

        return Inertia::render('inventory/stock-transfers/show', [
            'transfer' => $stockTransfer,
        ]);
    }

    public function edit(StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_edited) {
            return redirect()->route('inventory.stock-transfers.show', $stockTransfer)
                ->with('error', 'Stock Transfer tidak dapat diedit karena statusnya sudah berubah.');
        }

        $stockTransfer->load(['items.product']);
        $stores = Store::orderBy('name')->get();
        $products = Product::with(['category', 'inventories.store'])
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/stock-transfers/edit', [
            'transfer' => $stockTransfer,
            'stores' => $stores,
            'products' => $products,
        ]);
    }

    public function update(Request $request, StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_edited) {
            return redirect()->route('inventory.stock-transfers.show', $stockTransfer)
                ->with('error', 'Stock Transfer tidak dapat diedit karena statusnya sudah berubah.');
        }

        $request->validate([
            'from_store_id' => 'required|exists:stores,id',
            'to_store_id' => 'required|exists:stores,id|different:from_store_id',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity_requested' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Delete existing items
            $stockTransfer->items()->delete();

            // Update stock transfer
            $stockTransfer->update([
                'from_store_id' => $request->from_store_id,
                'to_store_id' => $request->to_store_id,
                'transfer_date' => $request->transfer_date,
                'notes' => $request->notes,
            ]);

            // Create new transfer items
            $totalValue = 0;
            foreach ($request->items as $item) {
                // Check stock availability
                $inventory = Inventory::where('store_id', $request->from_store_id)
                    ->where('product_id', $item['product_id'])
                    ->first();

                if (!$inventory || $inventory->current_stock < $item['quantity_requested']) {
                    $product = Product::find($item['product_id']);
                    throw new \Exception("Stok tidak mencukupi untuk produk: {$product->name}");
                }

                $transferItem = StockTransferItem::create([
                    'stock_transfer_id' => $stockTransfer->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'unit_cost' => $item['unit_cost'],
                    'notes' => $item['notes'] ?? null,
                ]);

                $totalValue += $transferItem->total_cost;
            }

            // Update total value
            $stockTransfer->update(['total_value' => $totalValue]);

            DB::commit();

            return redirect()->route('inventory.stock-transfers.show', $stockTransfer)
                ->with('success', 'Stock Transfer berhasil diupdate.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function destroy(StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_edited) {
            return back()->with('error', 'Stock Transfer tidak dapat dihapus karena statusnya sudah berubah.');
        }

        DB::beginTransaction();
        try {
            $stockTransfer->items()->delete();
            $stockTransfer->delete();

            DB::commit();

            return redirect()->route('inventory.stock-transfers.index')
                ->with('success', 'Stock Transfer berhasil dihapus.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal menghapus stock transfer: ' . $e->getMessage());
        }
    }

    public function approve(StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_approved) {
            return back()->with('error', 'Stock Transfer tidak dapat diapprove.');
        }

        $stockTransfer->approve(Auth::id());

        return back()->with('success', 'Stock Transfer berhasil diapprove.');
    }

    public function reject(StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status !== 'pending') {
            return back()->with('error', 'Stock Transfer tidak dapat ditolak.');
        }

        $stockTransfer->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Stock Transfer berhasil ditolak.');
    }

    public function ship(Request $request, StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_shipped) {
            return back()->with('error', 'Stock Transfer tidak dapat dikirim.');
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.quantity_shipped' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Update shipped quantities
            foreach ($request->items as $itemId => $data) {
                $item = $stockTransfer->items()->find($itemId);
                if ($item) {
                    $item->update(['quantity_shipped' => $data['quantity_shipped']]);
                }
            }

            $stockTransfer->ship(Auth::id());

            DB::commit();

            return back()->with('success', 'Stock Transfer berhasil dikirim.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal mengirim stock transfer: ' . $e->getMessage());
        }
    }

    public function receive(Request $request, StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_received) {
            return back()->with('error', 'Stock Transfer tidak dapat diterima.');
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.quantity_received' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $receivedItems = [];
            foreach ($request->items as $itemId => $data) {
                $receivedItems[$itemId] = $data['quantity_received'];
            }

            $stockTransfer->receive(Auth::id(), $receivedItems);

            DB::commit();

            return back()->with('success', 'Stock Transfer berhasil diterima.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal menerima stock transfer: ' . $e->getMessage());
        }
    }

    public function cancel(Request $request, StockTransfer $stockTransfer)
    {
        if (!$stockTransfer->can_be_cancelled) {
            return back()->with('error', 'Stock Transfer tidak dapat dibatalkan.');
        }

        $stockTransfer->cancel($request->reason);

        return back()->with('success', 'Stock Transfer berhasil dibatalkan.');
    }

    public function getProductStock(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'product_id' => 'required|exists:products,id',
        ]);

        $inventory = Inventory::where('store_id', $request->store_id)
            ->where('product_id', $request->product_id)
            ->first();

        return response()->json([
            'current_stock' => $inventory ? $inventory->current_stock : 0,
        ]);
    }
}
