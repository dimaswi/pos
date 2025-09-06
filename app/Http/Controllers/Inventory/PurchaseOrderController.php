<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderReceiveHistory;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('perPage', 10);
        $search = $request->get('search', '');
        $storeId = $request->get('store_id', '');
        $supplierId = $request->get('supplier_id', '');
        $status = $request->get('status', '');

        $purchaseOrders = PurchaseOrder::query()
            ->with(['store', 'supplier', 'createdBy', 'items'])
            ->withCount('items as items_count')
            ->when($search, function ($query, $search) {
                return $query->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->when($storeId, function ($query, $storeId) {
                return $query->where('store_id', $storeId);
            })
            ->when($supplierId, function ($query, $supplierId) {
                return $query->where('supplier_id', $supplierId);
            })
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Add progress_percentage to each purchase order
        $purchaseOrders->getCollection()->transform(function ($po) {
            $po->progress_percentage = $po->progress_percentage;
            $po->created_by_user = $po->createdBy;
            return $po;
        });

        $stores = Store::where('is_active', true)->get();
        $suppliers = Supplier::where('is_active', true)->get();

        return Inertia::render('inventory/purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
            'stores' => $stores,
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'store_id' => $storeId,
                'supplier_id' => $supplierId,
                'status' => $status,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $stores = Store::where('is_active', true)->get();
        $suppliers = Supplier::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with('category')->get();

        return Inertia::render('inventory/purchase-orders/create', [
            'stores' => $stores,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Generate PO Number
            $poNumber = $this->generatePONumber();

            // Calculate totals
            $subtotal = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_cost'];
            });

            $totalAmount = $subtotal + ($request->tax_amount ?? 0) + ($request->shipping_cost ?? 0) - ($request->discount_amount ?? 0);

            // Create Purchase Order
            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $poNumber,
                'store_id' => $request->store_id,
                'supplier_id' => $request->supplier_id,
                'created_by' => Auth::id(),
                'order_date' => $request->order_date,
                'expected_date' => $request->expected_date,
                'status' => 'draft',
                'subtotal' => $subtotal,
                'tax_amount' => $request->tax_amount ?? 0,
                'shipping_cost' => $request->shipping_cost ?? 0,
                'discount_amount' => $request->discount_amount ?? 0,
                'total_amount' => $totalAmount,
                'notes' => $request->notes,
            ]);

            // Create Purchase Order Items
            foreach ($request->items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['quantity'] * $item['unit_cost'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('inventory.purchase-orders.show', $purchaseOrder)
                ->with('success', 'Purchase Order created successfully');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to create Purchase Order: ' . $e->getMessage());
        }
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['store', 'supplier', 'createdBy', 'items.product']);

        return Inertia::render('inventory/purchase-orders/show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function edit(PurchaseOrder $purchaseOrder)
    {
        if (!$purchaseOrder->canBeEdited()) {
            return back()->with('error', 'Purchase Order cannot be edited in current status');
        }

        $purchaseOrder->load(['items.product']);
        $stores = Store::where('is_active', true)->get();
        $suppliers = Supplier::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with('category')->get();

        return Inertia::render('inventory/purchase-orders/edit', [
            'purchaseOrder' => $purchaseOrder,
            'stores' => $stores,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        if (!$purchaseOrder->canBeEdited()) {
            return back()->with('error', 'Purchase Order cannot be edited in current status');
        }

        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_cost'];
            });

            $totalAmount = $subtotal + ($request->tax_amount ?? 0) + ($request->shipping_cost ?? 0) - ($request->discount_amount ?? 0);

            // Update Purchase Order
            $purchaseOrder->update([
                'store_id' => $request->store_id,
                'supplier_id' => $request->supplier_id,
                'order_date' => $request->order_date,
                'expected_date' => $request->expected_date,
                'subtotal' => $subtotal,
                'tax_amount' => $request->tax_amount ?? 0,
                'shipping_cost' => $request->shipping_cost ?? 0,
                'discount_amount' => $request->discount_amount ?? 0,
                'total_amount' => $totalAmount,
                'notes' => $request->notes,
            ]);

            // Delete existing items and recreate
            $purchaseOrder->items()->delete();

            foreach ($request->items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['quantity'] * $item['unit_cost'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('inventory.purchase-orders.show', $purchaseOrder)
                ->with('success', 'Purchase Order updated successfully');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Failed to update Purchase Order: ' . $e->getMessage());
        }
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if (!in_array($purchaseOrder->status, ['draft', 'cancelled'])) {
            return back()->with('error', 'Purchase Order cannot be deleted in current status');
        }

        $purchaseOrder->delete();

        return redirect()
            ->route('inventory.purchase-orders.index')
            ->with('success', 'Purchase Order deleted successfully');
    }

    public function approve(PurchaseOrder $purchaseOrder)
    {
        if (!$purchaseOrder->canBeApproved()) {
            return back()->with('error', 'Purchase Order cannot be approved in current status');
        }

        $purchaseOrder->update(['status' => 'approved']);

        return back()->with('success', 'Purchase Order approved successfully');
    }

    public function reject(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'pending') {
            return back()->with('error', 'Purchase Order cannot be rejected in current status');
        }

        $purchaseOrder->update(['status' => 'rejected']);

        return back()->with('success', 'Purchase Order rejected successfully');
    }

    public function submit(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return back()->with('error', 'Purchase Order can only be submitted when in draft status');
        }

        $purchaseOrder->update(['status' => 'pending']);

        return back()->with('success', 'Purchase Order submitted for approval successfully');
    }

    public function receiveForm(PurchaseOrder $purchaseOrder)
    {
        Log::info('Receive form accessed', [
            'po_id' => $purchaseOrder->id,
            'po_status' => $purchaseOrder->status,
            'po_number' => $purchaseOrder->po_number
        ]);

        if (!in_array($purchaseOrder->status, ['approved', 'ordered', 'partial_received'])) {
            Log::warning('Invalid status for receive', [
                'po_id' => $purchaseOrder->id,
                'status' => $purchaseOrder->status
            ]);
            return redirect()->route('inventory.purchase-orders.show', $purchaseOrder)
                ->with('error', 'Purchase Order cannot be received in current status: ' . $purchaseOrder->status);
        }

        $purchaseOrder->load(['store', 'supplier', 'items.product']);

        return Inertia::render('inventory/purchase-orders/receive', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function tracking(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load([
            'store', 
            'supplier', 
            'items.product',
            'receiveHistory.receivedBy'
        ]);

        // Transform the receive history to match frontend expectations
        $purchaseOrder->receive_history = $purchaseOrder->receiveHistory->map(function ($history) use ($purchaseOrder) {
            return [
                'id' => $history->id,
                'received_date' => $history->received_date,
                'notes' => $history->notes,
                'created_at' => $history->created_at,
                'received_by' => $history->receivedBy ? [
                    'id' => $history->receivedBy->id,
                    'name' => $history->receivedBy->name,
                ] : null,
                'items_received' => collect($history->items_received)->map(function ($item) use ($purchaseOrder) {
                    // Handle both old format (item_id) and new format (id)
                    $itemId = $item['id'] ?? $item['item_id'] ?? null;
                    $poItem = $itemId ? $purchaseOrder->items->find($itemId) : null;
                    
                    return [
                        'item_id' => $itemId,
                        'quantity_received' => $item['quantity_received'],
                        'product' => $poItem ? [
                            'id' => $poItem->product->id,
                            'name' => $poItem->product->name,
                            'code' => $poItem->product->sku,
                        ] : [
                            'id' => null,
                            'name' => $item['product']['name'] ?? 'Unknown Product',
                            'code' => $item['product']['sku'] ?? '-',
                        ],
                    ];
                })->toArray(),
            ];
        });

        return Inertia::render('inventory/purchase-orders/tracking', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        if (!$purchaseOrder->canBeReceived()) {
            return redirect()->route('inventory.purchase-orders.show', $purchaseOrder)
                ->with('error', 'Purchase Order cannot be received in current status');
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|integer|min:0',
        ]);

        $inventoryService = new InventoryService();

        DB::beginTransaction();
        try {
            foreach ($request->items as $itemData) {
                $item = PurchaseOrderItem::find($itemData['id']);
                $quantityReceived = min($itemData['quantity_received'], $item->remaining_quantity);
                
                if ($quantityReceived > 0) {
                    $item->update([
                        'quantity_received' => $item->quantity_received + $quantityReceived
                    ]);

                    // Use InventoryService to handle inventory update with average cost calculation
                    $inventoryService->receivePurchase(
                        $item->product,
                        $purchaseOrder->store_id,
                        $quantityReceived,
                        $item->unit_cost
                    );
                }
            }

            // Update PO status
            $allReceived = $purchaseOrder->items()->where('quantity_received', '<', DB::raw('quantity_ordered'))->count() === 0;
            $partialReceived = $purchaseOrder->items()->where('quantity_received', '>', 0)->count() > 0;

            if ($allReceived) {
                $purchaseOrder->update([
                    'status' => 'received',
                    'received_date' => now(),
                ]);
            } elseif ($partialReceived) {
                $purchaseOrder->update(['status' => 'partial_received']);
            }

            // Create receive history record
            $historyItems = [];
            foreach ($request->items as $itemData) {
                $item = PurchaseOrderItem::find($itemData['id']);
                if ($itemData['quantity_received'] > 0) {
                    $historyItems[] = [
                        'id' => $item->id,
                        'product' => [
                            'name' => $item->product->name,
                            'code' => $item->product->sku,
                        ],
                        'quantity_received' => $itemData['quantity_received'],
                        'unit_cost' => $item->unit_cost,
                    ];
                }
            }

            PurchaseOrderReceiveHistory::create([
                'purchase_order_id' => $purchaseOrder->id,
                'received_by' => Auth::id(),
                'received_date' => $request->received_date,
                'notes' => $request->notes,
                'items_received' => $historyItems,
            ]);

            DB::commit();

            $message = $allReceived ? 'Semua item berhasil diterima!' : 'Item berhasil diterima sebagian.';
            
            return redirect()->route('inventory.purchase-orders.show', $purchaseOrder)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->route('inventory.purchase-orders.show', $purchaseOrder)
                ->with('error', 'Failed to receive items: ' . $e->getMessage());
        }
    }

    private function generatePONumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        $sequence = PurchaseOrder::whereDate('created_at', now())->count() + 1;
        
        return $prefix . $date . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }
}
