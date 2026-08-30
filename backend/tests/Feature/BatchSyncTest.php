<?php

namespace SunmiPos\Backend\Tests\Feature;

use SunmiPos\Backend\Models\BatchSyncLog;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\Order;
use SunmiPos\Backend\Models\Product;
use SunmiPos\Backend\Tests\TestCase;

class BatchSyncTest extends TestCase
{
    /** @test */
    public function it_can_ingest_a_full_day_offline_batch_in_one_atomic_request()
    {
        $branch = Branch::first();
        $product1 = Product::first();
        $initialStock = Inventory::where('branch_id', $branch->id)->where('product_id', $product1->id)->value('stock_quantity');

        $batchPayload = [
            'branch_id' => $branch->id,
            'batch_id' => 'BATCH-TEST-BR01-' . time(),
            'device_serial' => 'SUNMI-V2S-BR01-01',
            'sync_date' => now()->toDateString(),
            'shift_summary' => [
                'cashier_id' => 1,
                'opening_float' => 1000.00,
                'closing_cash' => 4500.00,
                'total_gross_sales' => 3500.00,
                'orders_count' => 2
            ],
            'orders' => [
                [
                    'order_number' => 'BR01-' . date('Ymd') . '-0001',
                    'client_tx_id' => 'TX_OFF_001',
                    'subtotal' => 290.00,
                    'total_amount' => 290.00,
                    'payment_method' => 'cash',
                    'amount_tendered' => 300.00,
                    'change_amount' => 10.00,
                    'created_at' => now()->subHours(4)->toDateTimeString(),
                    'items' => [
                        [
                            'product_id' => $product1->id,
                            'name' => $product1->name,
                            'qty' => 2,
                            'unit_price' => 145.00,
                            'total_price' => 290.00
                        ]
                    ]
                ],
                [
                    'order_number' => 'BR01-' . date('Ymd') . '-0002',
                    'client_tx_id' => 'TX_OFF_002',
                    'subtotal' => 180.00,
                    'total_amount' => 180.00,
                    'payment_method' => 'gcash',
                    'amount_tendered' => 180.00,
                    'change_amount' => 0.00,
                    'created_at' => now()->subHours(2)->toDateTimeString(),
                    'items' => [
                        [
                            'product_id' => null,
                            'name' => 'Custom Pastry Box',
                            'qty' => 1,
                            'unit_price' => 180.00,
                            'total_price' => 180.00
                        ]
                    ]
                ]
            ],
            'timeclocks' => [
                [
                    'user_id' => 1,
                    'clock_in' => now()->subHours(8)->toDateTimeString(),
                    'clock_out' => now()->toDateTimeString(),
                    'total_hours' => 8.0
                ]
            ]
        ];

        $response = $this->postJson('/api/v1/sync/batch-push', $batchPayload);
        $response->assertStatus(201);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('orders_synced', 2);
        $response->assertJsonPath('total_gross_sales', 470);

        // Verify stock deducted for product 1
        $newStock = Inventory::where('branch_id', $branch->id)->where('product_id', $product1->id)->value('stock_quantity');
        $this->assertEquals($initialStock - 2, $newStock);

        // Verify orders created in database
        $this->assertDatabaseHas('orders', ['order_number' => 'BR01-' . date('Ymd') . '-0001']);
        $this->assertDatabaseHas('orders', ['order_number' => 'BR01-' . date('Ymd') . '-0002']);

        // Test Idempotency: re-sending the same batch should not duplicate
        $retryResponse = $this->postJson('/api/v1/sync/batch-push', $batchPayload);
        $retryResponse->assertStatus(200);
        $retryResponse->assertJsonPath('status', 'duplicate_acknowledged');
    }

    /** @test */
    public function it_can_return_branch_sync_status_matrix()
    {
        $response = $this->getJson('/api/v1/sync/branch-status');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'sync_date',
            'branches' => [
                '*' => ['branch_id', 'name', 'code', 'is_synced_today', 'sync_status', 'total_orders', 'total_sales']
            ]
        ]);
    }
}
