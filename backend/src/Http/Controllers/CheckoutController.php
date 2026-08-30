<?php

namespace SunmiPos\Backend\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Services\CheckoutService;

class CheckoutController
{
    protected CheckoutService $checkoutService;

    public function __construct()
    {
        $this->checkoutService = new CheckoutService();
    }

    public function processCheckout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'device_id' => 'nullable|exists:devices,id',
            'cashier_id' => 'nullable|exists:users,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,gcash,maya,card',
            'amount_tendered' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'payment_reference' => 'nullable|string',
            'client_tx_id' => 'nullable|string'
        ]);

        try {
            $result = $this->checkoutService->processCheckout($validated);
            return response()->json([
                'status' => 'success',
                'message' => 'Transaction completed successfully',
                'data' => $result
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
