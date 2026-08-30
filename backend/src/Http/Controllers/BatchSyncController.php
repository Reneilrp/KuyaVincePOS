<?php

namespace SunmiPos\Backend\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SunmiPos\Backend\Models\BatchSyncLog;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Device;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\InventoryAdjustment;
use SunmiPos\Backend\Models\Order;
use SunmiPos\Backend\Models\OrderItem;
use SunmiPos\Backend\Models\Shift;
use SunmiPos\Backend\Models\StaffTimeclock;

class BatchSyncController
{
    /**
     * Ingest an entire day's offline sales bundle in 1 atomic HTTP POST request.
     */
    public function handleDailyBatchPush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'batch_id' => 'required|string',
            'device_serial' => 'nullable|string',
            'sync_date' => 'required|date',
            'shift_summary' => 'nullable|array',
            'orders' => 'required|array',
            'timeclocks' => 'nullable|array',
            'stock_adjustments' => 'nullable|array'
        ]);

        $batchId = $validated['batch_id'];
        $branchId = $validated['branch_id'];

        // 1. Idempotency Check: Prevent duplicate batch insertion if tapped multiple times
        $existingBatch = BatchSyncLog::where('batch_id', $batchId)->first();
        if ($existingBatch) {
            return response()->json([
                'status' => 'duplicate_acknowledged',
                'message' => "Batch '{$batchId}' was already processed on {$existingBatch->received_at->toIso8601String()}",
                'batch_sync_id' => $existingBatch->id,
                'orders_synced' => $existingBatch->orders_count,
                'gross_sales' => $existingBatch->gross_sales
            ]);
        }

        return DB::transaction(function () use ($validated, $batchId, $branchId) {
            $device = null;
            if (!empty($validated['device_serial'])) {
                $device = Device::where('device_serial', $validated['device_serial'])->first();
            }

            // 2. Create Batch Sync Log Record
            $batchLog = BatchSyncLog::create([
                'branch_id' => $branchId,
                'batch_id' => $batchId,
                'device_serial' => $validated['device_serial'] ?? null,
                'sync_date' => $validated['sync_date'],
                'orders_count' => count($validated['orders']),
                'gross_sales' => 0.00,
                'status' => 'success',
                'received_at' => now()
            ]);

            $totalGross = 0.00;

            // 3. Process Shift Summary if provided
            $shiftId = null;
            if (!empty($validated['shift_summary'])) {
                $sData = $validated['shift_summary'];
                $shift = Shift::create([
                    'branch_id' => $branchId,
                    'device_id' => $device ? $device->id : null,
                    'cashier_id' => $sData['cashier_id'] ?? 1,
                    'opening_cash' => $sData['opening_float'] ?? 0,
                    'closing_cash' => $sData['closing_cash'] ?? 0,
                    'expected_cash' => $sData['expected_cash'] ?? ($sData['total_gross_sales'] ?? 0),
                    'total_sales' => $sData['total_gross_sales'] ?? 0,
                    'order_count' => $sData['orders_count'] ?? count($validated['orders']),
                    'status' => 'closed',
                    'opened_at' => $sData['opened_at'] ?? now()->subHours(8),
                    'closed_at' => $sData['closed_at'] ?? now()
                ]);
                $shiftId = $shift->id;
            }

            // 4. Bulk Ingest Orders & Deduct Stock Atomically
            foreach ($validated['orders'] as $ordData) {
                $orderTotal = floatval($ordData['total_amount'] ?? 0);
                $totalGross += $orderTotal;

                $order = Order::firstOrCreate(
                    ['order_number' => $ordData['order_number']],
                    [
                        'branch_id' => $branchId,
                        'batch_sync_id' => $batchLog->id,
                        'device_id' => $device ? $device->id : null,
                        'cashier_id' => $ordData['cashier_id'] ?? 1,
                        'shift_id' => $shiftId,
                        'subtotal' => floatval($ordData['subtotal'] ?? $orderTotal),
                        'discount_amount' => floatval($ordData['discount_amount'] ?? 0),
                        'tax_amount' => 0.00,
                        'total_amount' => $orderTotal,
                        'payment_method' => $ordData['payment_method'] ?? 'cash',
                        'amount_tendered' => floatval($ordData['amount_tendered'] ?? $orderTotal),
                        'change_amount' => floatval($ordData['change_amount'] ?? 0),
                        'status' => 'completed',
                        'client_tx_id' => $ordData['client_tx_id'] ?? null,
                        'created_at' => $ordData['created_at'] ?? now()
                    ]
                );

                // Insert Items & reconcile local stock
                if (!empty($ordData['items'])) {
                    foreach ($ordData['items'] as $it) {
                        $qty = floatval($it['qty'] ?? ($it['quantity'] ?? 1));
                        $unitPrice = floatval($it['unit_price'] ?? 0);
                        $totalPrice = floatval($it['total_price'] ?? ($qty * $unitPrice));

                        OrderItem::create([
                            'order_id' => $order->id,
                            'product_id' => $it['product_id'] ?? null,
                            'product_name' => $it['name'] ?? ($it['product_name'] ?? 'Item'),
                            'unit_price' => $unitPrice,
                            'quantity' => $qty,
                            'total_price' => $totalPrice
                        ]);

                        // Reconcile Inventory stock deduction
                        if (!empty($it['product_id'])) {
                            $inv = Inventory::where('branch_id', $branchId)
                                ->where('product_id', $it['product_id'])
                                ->lockForUpdate()
                                ->first();

                            if ($inv) {
                                $inv->stock_quantity = max(0, $inv->stock_quantity - $qty);
                                $inv->save();
                            }
                        }
                    }
                }
            }

            // 5. Ingest Staff Timeclock Logs
            if (!empty($validated['timeclocks'])) {
                foreach ($validated['timeclocks'] as $tc) {
                    StaffTimeclock::create([
                        'user_id' => $tc['user_id'] ?? 1,
                        'branch_id' => $branchId,
                        'device_id' => $device ? $device->id : null,
                        'clock_in_at' => $tc['clock_in'] ?? now()->subHours(8),
                        'clock_out_at' => $tc['clock_out'] ?? now(),
                        'total_hours' => floatval($tc['total_hours'] ?? 8.0),
                        'status' => 'completed',
                        'notes' => 'Batch End-of-Day Sync'
                    ]);
                }
            }

            // Update final batch gross sales
            $batchLog->gross_sales = $totalGross;
            $batchLog->save();

            $branch = Branch::find($branchId);

            return response()->json([
                'status' => 'success',
                'message' => "Successfully synchronized " . count($validated['orders']) . " offline orders (₱" . number_format($totalGross, 2) . ") for {$branch->name}",
                'batch_id' => $batchLog->batch_id,
                'orders_synced' => count($validated['orders']),
                'total_gross_sales' => $totalGross,
                'synced_at' => $batchLog->received_at->toIso8601String()
            ], 201);
        });
    }

    /**
     * Get live branch sync status matrix for Admin Laptop Dashboard.
     */
    public function getBranchSyncStatus(): JsonResponse
    {
        $today = now()->toDateString();
        $branches = Branch::where('is_active', true)->with('devices')->get();

        $statusMatrix = $branches->map(function ($branch) use ($today) {
            $latestBatch = BatchSyncLog::where('branch_id', $branch->id)
                ->where('sync_date', $today)
                ->orderBy('received_at', 'desc')
                ->first();

            $totalOrdersToday = Order::where('branch_id', $branch->id)
                ->whereDate('created_at', $today)
                ->count();

            $totalSalesToday = floatval(Order::where('branch_id', $branch->id)
                ->whereDate('created_at', $today)
                ->sum('total_amount'));

            $isSyncedToday = $latestBatch !== null;

            return [
                'branch_id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_synced_today' => $isSyncedToday,
                'sync_status' => $isSyncedToday ? 'synced' : 'pending_upload',
                'last_synced_at' => $latestBatch ? $latestBatch->received_at->toIso8601String() : null,
                'latest_batch_id' => $latestBatch ? $latestBatch->batch_id : null,
                'total_orders' => $totalOrdersToday,
                'total_sales' => $totalSalesToday,
                'active_devices_count' => $branch->devices->count()
            ];
        });

        return response()->json([
            'status' => 'success',
            'sync_date' => $today,
            'branches' => $statusMatrix
        ]);
    }
}
