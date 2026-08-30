<?php

namespace SunmiPos\Backend\Tests\Feature;

use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Device;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\Product;
use SunmiPos\Backend\Models\User;
use SunmiPos\Backend\Tests\TestCase;

class MultiBranchPosTest extends TestCase
{
    /** @test */
    public function it_can_list_branches_and_pair_a_new_sunmi_device()
    {
        $response = $this->getJson('/api/v1/branches');
        $response->assertStatus(200);
        $response->assertJsonCount(3, 'branches');

        // Pair a new device to Branch 2
        $branch2 = Branch::where('code', 'BR-02')->first();
        $pairResponse = $this->postJson('/api/v1/devices/pair', [
            'device_serial' => 'SUNMI-TEST-SERIAL-999',
            'branch_id' => $branch2->id,
            'terminal_name' => 'Branch 2 - Mobile Rover 02'
        ]);

        $pairResponse->assertStatus(200);
        $pairResponse->assertJsonPath('device.terminal_name', 'Branch 2 - Mobile Rover 02');

        $this->assertDatabaseHas('devices', [
            'device_serial' => 'SUNMI-TEST-SERIAL-999',
            'branch_id' => $branch2->id
        ]);
    }

    /** @test */
    public function it_authenticates_cashier_via_pin_and_loads_branch_catalog()
    {
        // Cashier 1 PIN is 1234
        $authResponse = $this->postJson('/api/v1/auth/cashier-pin', [
            'pin_code' => '1234'
        ]);
        $authResponse->assertStatus(200);
        $authResponse->assertJsonPath('user.name', 'Maria Santos');

        // Load catalog for Branch 1
        $catalogResponse = $this->getJson('/api/v1/catalog?branch_id=1');
        $catalogResponse->assertStatus(200);
        $catalogResponse->assertJsonStructure([
            'categories',
            'products' => [
                '*' => ['id', 'name', 'base_price', 'stock', 'is_low_stock']
            ]
        ]);
    }

    /** @test */
    public function it_processes_an_order_and_deducts_stock_and_formats_58mm_receipt()
    {
        $branch = Branch::first();
        $product = Product::first();
        $initialStock = Inventory::where('branch_id', $branch->id)->where('product_id', $product->id)->value('stock_quantity');

        $checkoutPayload = [
            'branch_id' => $branch->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2
                ]
            ],
            'payment_method' => 'cash',
            'amount_tendered' => 500.00
        ];

        $response = $this->postJson('/api/v1/checkout', $checkoutPayload);
        $response->assertStatus(201);
        $response->assertJsonPath('status', 'success');

        // Verify stock deducted
        $newStock = Inventory::where('branch_id', $branch->id)->where('product_id', $product->id)->value('stock_quantity');
        $this->assertEquals($initialStock - 2, $newStock);

        // Verify 58mm thermal receipt payload
        $response->assertJsonStructure([
            'data' => [
                'receipt' => [
                    'store_header' => ['name', 'branch_code'],
                    'order_info' => ['order_number', 'date_time'],
                    'items',
                    'totals' => ['subtotal', 'total', 'amount_tendered', 'change']
                ]
            ]
        ]);
    }

    /** @test */
    public function it_restocks_branch_inventory_and_logs_adjustment()
    {
        $branch = Branch::first();
        $product = Product::first();
        $initialStock = Inventory::where('branch_id', $branch->id)->where('product_id', $product->id)->value('stock_quantity');

        $response = $this->postJson('/api/v1/inventory/restock', [
            'branch_id' => $branch->id,
            'product_id' => $product->id,
            'quantity' => 50,
            'notes' => 'Weekly Restock Batch'
        ]);

        $response->assertStatus(200);
        $newStock = Inventory::where('branch_id', $branch->id)->where('product_id', $product->id)->value('stock_quantity');
        $this->assertEquals($initialStock + 50, $newStock);

        $this->assertDatabaseHas('inventory_adjustments', [
            'branch_id' => $branch->id,
            'product_id' => $product->id,
            'type' => 'restock',
            'quantity_change' => 50
        ]);
    }

    /** @test */
    public function it_handles_shift_opening_and_z_reading_generation()
    {
        $branch = Branch::first();
        $cashier = User::where('role', 'cashier')->first();

        // Open shift
        $openResponse = $this->postJson('/api/v1/shifts/open', [
            'branch_id' => $branch->id,
            'cashier_id' => $cashier->id,
            'opening_cash' => 1000.00
        ]);
        $openResponse->assertStatus(201);
        $shiftId = $openResponse->json('shift.id');

        // Close shift
        $closeResponse = $this->postJson("/api/v1/shifts/{$shiftId}/close", [
            'closing_cash' => 1000.00
        ]);
        $closeResponse->assertStatus(200);
        $closeResponse->assertJsonStructure([
            'z_report' => [
                'report_title',
                'branch',
                'cashier',
                'financials' => ['opening_float', 'total_gross_sales', 'actual_counted_cash']
            ]
        ]);
    }

    /** @test */
    public function it_calculates_staff_payroll_based_on_timeclock_hours()
    {
        $cashier = User::where('role', 'cashier')->first();
        $cashier->hourly_rate = 100.00;
        $cashier->save();

        // Clock in
        $inResponse = $this->postJson('/api/v1/timeclock/in', [
            'user_id' => $cashier->id,
            'branch_id' => $cashier->branch_id
        ]);
        $inResponse->assertStatus(201);

        // Clock out
        $outResponse = $this->postJson('/api/v1/timeclock/out', [
            'user_id' => $cashier->id
        ]);
        $outResponse->assertStatus(200);

        // Calculate Payroll
        $payrollResponse = $this->postJson('/api/v1/payroll/calculate', [
            'branch_id' => 'all',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString()
        ]);
        $payrollResponse->assertStatus(200);
        $payrollResponse->assertJsonStructure([
            'payroll' => [
                '*' => ['user_id', 'staff_name', 'hourly_rate', 'total_hours', 'gross_pay', 'net_pay']
            ]
        ]);
    }

    /** @test */
    public function it_provides_live_analytics_and_branch_comparisons()
    {
        $response = $this->getJson('/api/v1/analytics/overview?branch_id=all&range=today');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'kpis' => ['total_gross_revenue', 'total_sales_count', 'average_order_value'],
            'branch_comparison' => [
                '*' => ['branch_id', 'name', 'code', 'total_sales', 'order_count']
            ]
        ]);
    }
}
