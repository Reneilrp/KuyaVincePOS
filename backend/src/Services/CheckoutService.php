<?php

namespace SunmiPos\Backend\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Device;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\InventoryAdjustment;
use SunmiPos\Backend\Models\Order;
use SunmiPos\Backend\Models\OrderItem;
use SunmiPos\Backend\Models\Product;
use SunmiPos\Backend\Models\Shift;

class CheckoutService
{
    /**
     * Process an atomic checkout with pessimistic inventory locks and 58mm receipt formatting.
     */
    public function processCheckout(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $branchId = $data['branch_id'];
            $deviceId = $data['device_id'] ?? null;
            $cashierId = $data['cashier_id'] ?? null;
            $shiftId = $data['shift_id'] ?? null;
            $items = $data['items'];
            $paymentMethod = $data['payment_method'] ?? 'cash';
            $amountTendered = floatval($data['amount_tendered'] ?? 0);
            $discountAmount = floatval($data['discount_amount'] ?? 0);
            $clientTxId = $data['client_tx_id'] ?? null;

            if (empty($items)) {
                throw new Exception("Cannot checkout an empty cart.");
            }

            // Check if active shift exists if shift_id provided
            if ($shiftId) {
                $shift = Shift::find($shiftId);
                if (!$shift || $shift->status !== 'open') {
                    throw new Exception("The specified cashier shift is not active or has already been closed.");
                }
            }

            // Calculate Subtotal and lock inventory rows
            $subtotal = 0.00;
            $validatedItems = [];

            foreach ($items as $itemData) {
                $productId = $itemData['product_id'];
                $quantity = floatval($itemData['quantity'] ?? 1);

                if ($quantity <= 0) {
                    throw new Exception("Invalid item quantity for product ID: {$productId}");
                }

                $product = Product::findOrFail($productId);
                $unitPrice = floatval($product->base_price);
                $itemTotal = round($unitPrice * $quantity, 2);
                $subtotal += $itemTotal;

                // Pessimistic lock on Branch Inventory
                $inventory = Inventory::where('branch_id', $branchId)
                    ->where('product_id', $productId)
                    ->lockForUpdate()
                    ->first();

                if (!$inventory) {
                    // Create inventory if not exists with 0
                    $inventory = Inventory::create([
                        'branch_id' => $branchId,
                        'product_id' => $productId,
                        'stock_quantity' => 0,
                        'alert_threshold' => 5
                    ]);
                }

                // Check stock availability
                if ($inventory->stock_quantity < $quantity) {
                    throw new Exception("Insufficient stock for '{$product->name}'. Available: {$inventory->stock_quantity}, Requested: {$quantity}");
                }

                // Deduct stock
                $inventory->stock_quantity -= $quantity;
                $inventory->save();

                // Log adjustment
                InventoryAdjustment::create([
                    'branch_id' => $branchId,
                    'product_id' => $productId,
                    'user_id' => $cashierId,
                    'type' => 'sale',
                    'quantity_change' => -$quantity,
                    'stock_after' => $inventory->stock_quantity,
                    'notes' => 'POS Checkout Sale'
                ]);

                $validatedItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'total_price' => $itemTotal
                ];
            }

            $totalAmount = max(0, round($subtotal - $discountAmount, 2));

            if ($paymentMethod === 'cash') {
                if ($amountTendered < $totalAmount) {
                    throw new Exception("Cash tendered (₱" . number_format($amountTendered, 2) . ") is less than total amount (₱" . number_format($totalAmount, 2) . ")");
                }
                $changeAmount = round($amountTendered - $totalAmount, 2);
            } else {
                $amountTendered = $totalAmount;
                $changeAmount = 0.00;
            }

            // Generate unique Order Number
            $branch = Branch::find($branchId);
            $branchCode = $branch ? $branch->code : 'BR';
            $orderNumber = $branchCode . '-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

            // Create Order
            $order = Order::create([
                'branch_id' => $branchId,
                'device_id' => $deviceId,
                'cashier_id' => $cashierId,
                'shift_id' => $shiftId,
                'order_number' => $orderNumber,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => 0.00,
                'total_amount' => $totalAmount,
                'payment_method' => $paymentMethod,
                'amount_tendered' => $amountTendered,
                'change_amount' => $changeAmount,
                'payment_reference' => $data['payment_reference'] ?? null,
                'status' => 'completed',
                'client_tx_id' => $clientTxId
            ]);

            // Create Order Items
            foreach ($validatedItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_price' => $item['total_price']
                ]);
            }

            // Update shift total sales if shift provided
            if ($shiftId && isset($shift)) {
                $shift->total_sales += $totalAmount;
                if ($paymentMethod === 'cash') {
                    $shift->expected_cash += $totalAmount;
                }
                $shift->order_count += 1;
                $shift->save();
            }

            // Generate Sunmi 58mm Thermal Print Receipt Payload
            $receiptPayload = $this->buildSunmi58mmReceiptPayload($order, $branch, $validatedItems);

            return [
                'success' => true,
                'order' => $order->load('items'),
                'receipt' => $receiptPayload
            ];
        });
    }

    /**
     * Build 58mm thermal receipt layout structure formatted for Sunmi handheld printers.
     */
    private function buildSunmi58mmReceiptPayload(Order $order, ?Branch $branch, array $items): array
    {
        return [
            'store_header' => [
                'name' => $branch ? $branch->name : 'POS System',
                'branch_code' => $branch ? $branch->code : 'BR-01',
                'address' => $branch ? $branch->address : '',
                'phone' => $branch ? $branch->phone : '',
            ],
            'order_info' => [
                'order_number' => $order->order_number,
                'date_time' => $order->created_at->format('Y-m-d H:i:s'),
                'cashier' => $order->cashier ? $order->cashier->name : 'Cashier',
                'payment_method' => strtoupper($order->payment_method),
            ],
            'items' => array_map(function ($item) {
                return [
                    'name' => $item['product_name'],
                    'qty' => $item['quantity'],
                    'unit_price' => number_format($item['unit_price'], 2),
                    'total_price' => number_format($item['total_price'], 2),
                ];
            }, $items),
            'totals' => [
                'subtotal' => number_format($order->subtotal, 2),
                'discount' => number_format($order->discount_amount, 2),
                'total' => number_format($order->total_amount, 2),
                'amount_tendered' => number_format($order->amount_tendered, 2),
                'change' => number_format($order->change_amount, 2),
            ],
            'footer' => [
                'message' => 'Thank you for your purchase!',
                'notice' => 'Please keep this receipt for returns/warranty'
            ]
        ];
    }
}
