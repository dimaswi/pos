<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentMethod::query();

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $paymentMethods = $query->withCount([
            'salesPayments as usage_count' => function ($q) {
                $q->whereHas('salesTransaction', function ($transaction) {
                    $transaction->whereNotIn('status', ['voided', 'refunded']);
                });
            }
        ])
            ->ordered()
            ->paginate($request->get('perPage', 15))
            ->withQueryString();

        // Statistics
        $stats = [
            'total_methods' => PaymentMethod::count(),
            'active_methods' => PaymentMethod::where('is_active', true)->count(),
            'cash_methods' => PaymentMethod::where('type', 'cash')->count(),
            'digital_methods' => PaymentMethod::whereIn('type', ['card', 'digital_wallet', 'bank_transfer'])->count(),
        ];

        return Inertia::render('sales/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'status', 'perPage']),
        ]);
    }

    public function create()
    {
        return Inertia::render('sales/payment-methods/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:payment_methods,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:cash,card,digital_wallet,bank_transfer,credit,other',
            'fee_percentage' => 'nullable|numeric|min:0|max:100',
            'fee_fixed' => 'nullable|numeric|min:0',
            'requires_reference' => 'boolean',
            'requires_authorization' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'settings' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        PaymentMethod::create($request->all());

        return redirect()->route('sales.payment-methods.index')
            ->with('success', 'Payment method created successfully.');
    }

    public function show(PaymentMethod $paymentMethod)
    {
        // Load usage count (excluding voided/refunded transactions)
        $paymentMethod->loadCount([
            'salesPayments as usage_count' => function ($q) {
                $q->whereHas('salesTransaction', function ($transaction) {
                    $transaction->whereNotIn('status', ['voided', 'refunded']);
                });
            }
        ]);
        
        // Get usage statistics (excluding voided/refunded transactions)
        $activePaymentsQuery = $paymentMethod->salesPayments()
            ->whereHas('salesTransaction', function ($query) {
                $query->whereNotIn('status', ['voided', 'refunded']);
            });
            
        $thisMonthPaymentsQuery = $paymentMethod->salesPayments()
            ->whereHas('salesTransaction', function ($query) {
                $query->whereNotIn('status', ['voided', 'refunded']);
            })
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
        
        $usageStats = [
            'total_transactions' => $activePaymentsQuery->count(),
            'total_amount' => $activePaymentsQuery->sum('amount'),
            'total_fees' => $activePaymentsQuery->sum('fee_amount'),
            'this_month_transactions' => $thisMonthPaymentsQuery->count(),
            'this_month_amount' => $thisMonthPaymentsQuery->sum('amount'),
            'this_month_fees' => $thisMonthPaymentsQuery->sum('fee_amount'),
        ];
        
        // Get recent transactions (excluding voided/refunded)
        $recentTransactions = $paymentMethod->salesPayments()
            ->with(['salesTransaction' => function ($query) {
                $query->select('id', 'transaction_number', 'total_amount', 'transaction_date', 'status')
                      ->whereNotIn('status', ['voided', 'refunded']);
            }])
            ->whereHas('salesTransaction', function ($query) {
                $query->whereNotIn('status', ['voided', 'refunded']);
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->salesTransaction->id,
                    'transaction_number' => $payment->salesTransaction->transaction_number,
                    'total_amount' => $payment->salesTransaction->total_amount,
                    'amount_paid' => $payment->amount,
                    'fee_amount' => $payment->fee_amount,
                    'transaction_date' => $payment->salesTransaction->transaction_date,
                    'status' => $payment->salesTransaction->status,
                ];
            });

        return Inertia::render('sales/payment-methods/show', [
            'paymentMethod' => array_merge($paymentMethod->toArray(), [
                'usage_stats' => $usageStats,
                'recent_transactions' => $recentTransactions,
            ]),
        ]);
    }

    public function edit(PaymentMethod $paymentMethod)
    {
        return Inertia::render('sales/payment-methods/edit', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:payment_methods,code,' . $paymentMethod->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:cash,card,digital_wallet,bank_transfer,credit,other',
            'fee_percentage' => 'nullable|numeric|min:0|max:100',
            'fee_fixed' => 'nullable|numeric|min:0',
            'requires_reference' => 'boolean',
            'requires_authorization' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'settings' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $paymentMethod->update($request->all());

        return redirect()->route('sales.payment-methods.index')
            ->with('success', 'Payment method updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        // Check if payment method is used in any sales
        $usageCount = $paymentMethod->salesPayments()->count();
        
        if ($usageCount > 0) {
            return redirect()->route('sales.payment-methods.index')
                ->with('error', 'Cannot delete payment method that has been used in transactions.');
        }

        $paymentMethod->delete();

        return redirect()->route('sales.payment-methods.index')
            ->with('success', 'Payment method deleted successfully.');
    }

    public function toggleStatus(PaymentMethod $paymentMethod)
    {
        $paymentMethod->toggleStatus();

        $status = $paymentMethod->is_active ? 'activated' : 'deactivated';
        
        return redirect()->route('sales.payment-methods.index')
            ->with('success', "Payment method {$status} successfully.");
    }
}
