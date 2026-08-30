<?php

namespace SunmiPos\Backend\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\Order;
use SunmiPos\Backend\Models\Shift;

class ShiftController
{
    /**
     * Open a new Cashier Register Shift.
     */
    public function openShift(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'cashier_id' => 'required|exists:users,id',
            'device_id' => 'nullable|exists:devices,id',
            'opening_cash' => 'required|numeric|min:0'
        ]);

        // Check if cashier already has an open shift on this device
        $existing = Shift::where('branch_id', $validated['branch_id'])
            ->where('cashier_id', $validated['cashier_id'])
            ->where('status', 'open')
            ->first();

        if ($existing) {
            return response()->json([
                'status' => 'success',
                'message' => 'Active shift already open',
                'shift' => $existing
            ]);
        }

        $shift = Shift::create([
            'branch_id' => $validated['branch_id'],
            'cashier_id' => $validated['cashier_id'],
            'device_id' => $validated['device_id'] ?? null,
            'opening_cash' => $validated['opening_cash'],
            'expected_cash' => $validated['opening_cash'],
            'total_sales' => 0.00,
            'order_count' => 0,
            'status' => 'open',
            'opened_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift opened successfully',
            'shift' => $shift
        ], 201);
    }

    /**
     * Close Register Shift & Generate Z-Reading report payload for Sunmi.
     */
    public function closeShift(Request $request, $id): JsonResponse
    {
        $shift = Shift::with(['branch', 'cashier', 'device'])->findOrFail($id);
        $closingCash = floatval($request->input('closing_cash', 0));

        $shift->closing_cash = $closingCash;
        $shift->status = 'closed';
        $shift->closed_at = now();
        $shift->save();

        $cashVariance = round($closingCash - floatval($shift->expected_cash), 2);

        // Payments breakdown
        $cashSales = Order::where('shift_id', $shift->id)->where('payment_method', 'cash')->sum('total_amount');
        $eWalletSales = Order::where('shift_id', $shift->id)->whereIn('payment_method', ['gcash', 'maya'])->sum('total_amount');
        $cardSales = Order::where('shift_id', $shift->id)->where('payment_method', 'card')->sum('total_amount');

        $zReport = [
            'report_title' => 'DAILY Z-READING / SHIFT SUMMARY',
            'branch' => $shift->branch ? $shift->branch->name : 'Main Store',
            'terminal' => $shift->device ? $shift->device->terminal_name : 'Default Register',
            'cashier' => $shift->cashier ? $shift->cashier->name : 'Cashier',
            'opened_at' => $shift->opened_at->format('Y-m-d H:i:s'),
            'closed_at' => $shift->closed_at->format('Y-m-d H:i:s'),
            'financials' => [
                'opening_float' => number_format($shift->opening_cash, 2),
                'cash_sales' => number_format($cashSales, 2),
                'ewallet_sales' => number_format($eWalletSales, 2),
                'card_sales' => number_format($cardSales, 2),
                'total_gross_sales' => number_format($shift->total_sales, 2),
                'expected_cash_in_drawer' => number_format($shift->expected_cash, 2),
                'actual_counted_cash' => number_format($closingCash, 2),
                'cash_over_short' => number_format($cashVariance, 2),
                'transactions_count' => $shift->order_count
            ]
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'Shift closed successfully',
            'shift' => $shift,
            'z_report' => $zReport
        ]);
    }
}
