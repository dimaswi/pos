<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDiscount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('customer_discount_id')) {
            $query->where('customer_discount_id', $request->customer_discount_id);
        }

        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $customers = $query->with(['customerDiscount'])
            ->withCount(['salesTransactions as total_transactions' => function($query) {
                $query->where('status', '!=', 'voided');
            }])
            ->withSum(['salesTransactions as total_spent' => function($query) {
                $query->where('status', '!=', 'voided');
            }], 'total_amount')
            ->with(['salesTransactions' => function($query) {
                $query->where('status', '!=', 'voided')
                      ->latest('transaction_date')
                      ->limit(1);
            }])
            ->latest()
            ->paginate($request->get('perPage', 15))
            ->withQueryString();

        // Add last_transaction_date to each customer
        $customers->getCollection()->transform(function ($customer) {
            $customer->last_transaction_date = $customer->salesTransactions->isNotEmpty() 
                ? $customer->salesTransactions->first()->transaction_date 
                : null;
            
            // Remove the relationship data to avoid over-fetching
            unset($customer->salesTransactions);
            
            return $customer;
        });

        $customerDiscounts = CustomerDiscount::get(['id', 'name', 'discount_percentage']);

        return Inertia::render('master-data/customers/index', [
            'customers' => $customers,
            'customerDiscounts' => $customerDiscounts,
            'filters' => $request->only(['search', 'customer_discount_id', 'status', 'perPage']),
        ]);
    }

    public function create()
    {
        $customerDiscounts = CustomerDiscount::get(['id', 'name', 'discount_percentage']);
        
        return Inertia::render('master-data/customers/create', [
            'customerDiscounts' => $customerDiscounts,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female',
            'customer_discount_id' => 'nullable|exists:customer_discounts,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            // Generate customer code
            $customerCode = $this->generateCustomerCode($request->customer_discount_id);

            $customer = Customer::create([
                'code' => $customerCode,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'birth_date' => $request->birth_date,
                'gender' => $request->gender,
                'customer_discount_id' => $request->customer_discount_id,
                'notes' => $request->notes,
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            DB::commit();

            return redirect()->route('master-data.customers.index')
                ->with('success', 'Pelanggan berhasil dibuat.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal membuat pelanggan: ' . $e->getMessage());
        }
    }

    public function show(Customer $customer)
    {
        $customer->load(['createdBy', 'updatedBy', 'customerDiscount']);

        // Get customer transaction stats
        $transactionStats = [
            'total_transactions' => $customer->salesTransactions()->count(),
            'total_spent' => $customer->salesTransactions()
                ->whereNotIn('status', ['voided', 'cancelled'])
                ->sum('total_amount'),
            'last_transaction' => $customer->salesTransactions()
                ->latest('transaction_date')
                ->first()?->transaction_date,
            'average_transaction' => $customer->salesTransactions()
                ->whereNotIn('status', ['voided', 'cancelled'])
                ->avg('total_amount') ?? 0,
        ];

        // Get recent transactions
        $recentTransactions = $customer->salesTransactions()
            ->with(['store', 'payments.paymentMethod'])
            ->latest('transaction_date')
            ->limit(10)
            ->get();

        return Inertia::render('master-data/customers/show', [
            'customer' => $customer,
            'transactionStats' => $transactionStats,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function edit(Customer $customer)
    {
        $customer->load('customerDiscount');
        $customerDiscounts = CustomerDiscount::all(['id', 'name', 'discount_percentage']);
        
        return Inertia::render('master-data/customers/edit', [
            'customer' => $customer,
            'customerDiscounts' => $customerDiscounts,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female',
            'customer_discount_id' => 'nullable|exists:customer_discounts,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $customer->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'birth_date' => $request->birth_date,
                'gender' => $request->gender,
                'customer_discount_id' => $request->customer_discount_id,
                'notes' => $request->notes,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            return redirect()->route('master-data.customers.index')
                ->with('success', 'Pelanggan berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Gagal memperbarui pelanggan: ' . $e->getMessage());
        }
    }

    public function destroy(Customer $customer)
    {
        // Check if customer has transactions
        if ($customer->salesTransactions()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus pelanggan yang sudah memiliki transaksi.');
        }

        $customer->delete();

        return redirect()->route('master-data.customers.index')
            ->with('success', 'Pelanggan berhasil dihapus.');
    }

    public function toggleStatus(Customer $customer)
    {
        $customer->update([
            'is_active' => !$customer->is_active,
            'updated_by' => Auth::id(),
        ]);

        $status = $customer->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Pelanggan berhasil {$status}.");
    }

    private function generateCustomerCode($customerDiscountId = null): string
    {
        if ($customerDiscountId) {
            $customerDiscount = CustomerDiscount::find($customerDiscountId);
            $prefix = 'MBR'; // Member
        } else {
            $prefix = 'CUS'; // Regular customer
        }

        $date = now()->format('Ymd');
        $sequence = Customer::whereDate('created_at', today())->count() + 1;

        return $prefix . $date . sprintf('%04d', $sequence);
    }

    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $customers = Customer::where('is_active', true)
            ->with('customerDiscount')
            ->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->query}%")
                  ->orWhere('code', 'like', "%{$request->query}%")
                  ->orWhere('phone', 'like', "%{$request->query}%");
            })
            ->limit(10)
            ->get(['id', 'code', 'name', 'phone', 'customer_discount_id']);

        return response()->json([
            'customers' => $customers
        ]);
    }
}
