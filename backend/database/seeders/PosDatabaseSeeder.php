<?php

namespace SunmiPos\Backend\Database\Seeders;

use Illuminate\Database\Seeder;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Category;
use SunmiPos\Backend\Models\Device;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\Product;
use SunmiPos\Backend\Models\User;

class PosDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create 2 Branches
        $branch1 = Branch::create([
            'name' => 'Main Branch - Gateway 1',
            'code' => 'BR-GW01',
            'address' => 'Gateway 1',
            'phone' => '+63 917 000 0001',
            'is_active' => true,
            'settings' => ['tax_rate' => 0.12, 'currency' => 'PHP']
        ]);

        $branch2 = Branch::create([
            'name' => 'Gateway Branch',
            'code' => 'BR-GW02',
            'address' => 'Gateway Branch',
            'phone' => '+63 917 000 0002',
            'is_active' => true,
            'settings' => ['tax_rate' => 0.12, 'currency' => 'PHP']
        ]);

        // 2. Create Users (Admin, Cashiers)
        $admin = User::create([
            'name' => 'Store Owner / Admin',
            'email' => 'admin@pos.local',
            'password' => 'admin123',
            'role' => 'admin',
            'pin_code' => '9999',
            'hourly_rate' => 0.00,
            'is_active' => true
        ]);

        $cashier1 = User::create([
            'branch_id' => $branch1->id,
            'name' => 'Maria Santos (Main Gateway 1)',
            'email' => 'maria@gateway1.local',
            'role' => 'cashier',
            'pin_code' => '1234',
            'hourly_rate' => 85.00,
            'is_active' => true
        ]);

        $cashier2 = User::create([
            'branch_id' => $branch2->id,
            'name' => 'John Dela Cruz (Gateway Branch)',
            'email' => 'john@gateway.local',
            'role' => 'cashier',
            'pin_code' => '5678',
            'hourly_rate' => 85.00,
            'is_active' => true
        ]);

        // 3. Register Sunmi Devices
        Device::create([
            'branch_id' => $branch1->id,
            'device_serial' => 'SUNMI-V2S-GW01-01',
            'terminal_name' => 'Gateway 1 - Counter 01',
            'device_token' => 'DVT_SUNMI_GW01_01',
            'status' => 'online',
            'last_seen_at' => now()
        ]);

        Device::create([
            'branch_id' => $branch2->id,
            'device_serial' => 'SUNMI-V2S-GW02-01',
            'terminal_name' => 'Gateway Branch - Counter 01',
            'device_token' => 'DVT_SUNMI_GW02_01',
            'status' => 'online',
            'last_seen_at' => now()
        ]);

        // 4. Create Categories
        $catBeef = Category::create(['name' => 'Beef', 'color' => '#DC2626', 'icon' => 'utensils']);
        $catChicken = Category::create(['name' => 'Chicken', 'color' => '#EA580C', 'icon' => 'utensils']);
        $catFish = Category::create(['name' => 'Fish', 'color' => '#0284C7', 'icon' => 'fish']);
        $catValueMeals = Category::create(['name' => 'Value Meals', 'color' => '#16A34A', 'icon' => 'badge-percent']);
        $catComboMeals = Category::create(['name' => 'Combo Meals', 'color' => '#D97706', 'icon' => 'utensils']);
        $catSausages = Category::create(['name' => 'Sausages', 'color' => '#9333EA', 'icon' => 'utensils']);
        $catNoodles = Category::create(['name' => 'Noodles', 'color' => '#CA8A04', 'icon' => 'bowl-food']);
        $catDrinks = Category::create(['name' => 'Drinks', 'color' => '#2563EB', 'icon' => 'cup-soda']);
        $catAddons = Category::create(['name' => 'Add-ons', 'color' => '#64748B', 'icon' => 'plus-circle']);

        // 5. Create Master Products (44 items)
        $catalog = [
            // Beef
            ['cat' => $catBeef->id, 'name' => 'Bulalo', 'price' => 200.00, 'cost' => 80.00, 'b2_override' => null],
            ['cat' => $catBeef->id, 'name' => 'Balbacua Solo', 'price' => 120.00, 'cost' => 50.00, 'b2_override' => null],
            ['cat' => $catBeef->id, 'name' => 'Beef Arroz Caldo', 'price' => 70.00, 'cost' => 25.00, 'b2_override' => null],
            ['cat' => $catBeef->id, 'name' => 'Beef Mami', 'price' => 70.00, 'cost' => 25.00, 'b2_override' => 65.00],
            ['cat' => $catBeef->id, 'name' => 'Paklay', 'price' => 80.00, 'cost' => 30.00, 'b2_override' => null],

            // Chicken
            ['cat' => $catChicken->id, 'name' => 'Fried Chicken (A la carte)', 'price' => 50.00, 'cost' => 20.00, 'b2_override' => null],
            ['cat' => $catChicken->id, 'name' => 'Chicken Adobo', 'price' => 50.00, 'cost' => 20.00, 'b2_override' => null],
            ['cat' => $catChicken->id, 'name' => 'Chicken Halang', 'price' => 50.00, 'cost' => 20.00, 'b2_override' => null],
            ['cat' => $catChicken->id, 'name' => 'Sabaw Manok', 'price' => 50.00, 'cost' => 18.00, 'b2_override' => null],
            ['cat' => $catChicken->id, 'name' => 'Chicken Barbecue', 'price' => 70.00, 'cost' => 28.00, 'b2_override' => null],
            ['cat' => $catChicken->id, 'name' => 'Chicken Sisig (A la carte)', 'price' => 50.00, 'cost' => 20.00, 'b2_override' => null],
            ['cat' => $catChicken->id, 'name' => 'Chicken Mami', 'price' => 70.00, 'cost' => 25.00, 'b2_override' => 65.00],
            ['cat' => $catChicken->id, 'name' => 'Chicken Arroz Caldo', 'price' => 70.00, 'cost' => 25.00, 'b2_override' => null],

            // Fish
            ['cat' => $catFish->id, 'name' => 'Fried Fish', 'price' => 50.00, 'cost' => 20.00, 'b2_override' => null],
            ['cat' => $catFish->id, 'name' => 'Paksiw Bangus', 'price' => 50.00, 'cost' => 20.00, 'b2_override' => null],
            ['cat' => $catFish->id, 'name' => 'Soup Fish', 'price' => 50.00, 'cost' => 18.00, 'b2_override' => null],

            // Value Meals
            ['cat' => $catValueMeals->id, 'name' => 'Fried Chicken Value Meal', 'price' => 60.00, 'cost' => 25.00, 'b2_override' => null],
            ['cat' => $catValueMeals->id, 'name' => 'Chicken Sisig Value Meal', 'price' => 60.00, 'cost' => 25.00, 'b2_override' => null],
            ['cat' => $catValueMeals->id, 'name' => 'Beef Pares Value Meal', 'price' => 55.00, 'cost' => 22.00, 'b2_override' => null],

            // Combo Meals
            ['cat' => $catComboMeals->id, 'name' => 'Beef Bulalo Meal', 'price' => 130.00, 'cost' => 55.00, 'b2_override' => null],
            ['cat' => $catComboMeals->id, 'name' => 'Beef Balbacua Meal', 'price' => 160.00, 'cost' => 65.00, 'b2_override' => null],
            ['cat' => $catComboMeals->id, 'name' => 'Beef Bicol Express Meal', 'price' => 160.00, 'cost' => 65.00, 'b2_override' => null],
            ['cat' => $catComboMeals->id, 'name' => 'Chicken Sisig Meal', 'price' => 130.00, 'cost' => 50.00, 'b2_override' => null],
            ['cat' => $catComboMeals->id, 'name' => 'Chicken Barbecue Meal', 'price' => 130.00, 'cost' => 50.00, 'b2_override' => 120.00],
            ['cat' => $catComboMeals->id, 'name' => 'Fried Chicken Meal', 'price' => 120.00, 'cost' => 45.00, 'b2_override' => 89.00],
            ['cat' => $catComboMeals->id, 'name' => 'Beef Pares Meal', 'price' => 160.00, 'cost' => 60.00, 'b2_override' => 75.00],

            // Sausages
            ['cat' => $catSausages->id, 'name' => 'Longganisa', 'price' => 25.00, 'cost' => 10.00, 'b2_override' => null],
            ['cat' => $catSausages->id, 'name' => 'Hotdog', 'price' => 15.00, 'cost' => 6.00, 'b2_override' => null],
            ['cat' => $catSausages->id, 'name' => 'Hungarian Sausage', 'price' => 35.00, 'cost' => 15.00, 'b2_override' => null],

            // Noodles
            ['cat' => $catNoodles->id, 'name' => 'Pancit Guisado', 'price' => 30.00, 'cost' => 12.00, 'b2_override' => null],
            ['cat' => $catNoodles->id, 'name' => 'Sotanghon Guisado', 'price' => 30.00, 'cost' => 12.00, 'b2_override' => null],
            ['cat' => $catNoodles->id, 'name' => 'Bihon', 'price' => 30.00, 'cost' => 12.00, 'b2_override' => null],
            ['cat' => $catNoodles->id, 'name' => 'Bam-e', 'price' => 30.00, 'cost' => 12.00, 'b2_override' => null],

            // Drinks
            ['cat' => $catDrinks->id, 'name' => 'Royal', 'price' => 30.00, 'cost' => 15.00, 'b2_override' => null],
            ['cat' => $catDrinks->id, 'name' => 'Coke', 'price' => 30.00, 'cost' => 15.00, 'b2_override' => null],
            ['cat' => $catDrinks->id, 'name' => 'Sprite', 'price' => 30.00, 'cost' => 15.00, 'b2_override' => null],
            ['cat' => $catDrinks->id, 'name' => 'Mountain Dew', 'price' => 30.00, 'cost' => 15.00, 'b2_override' => null],
            ['cat' => $catDrinks->id, 'name' => 'Calamansi Juice', 'price' => 30.00, 'cost' => 10.00, 'b2_override' => null],
            ['cat' => $catDrinks->id, 'name' => 'Bottled Water 1L', 'price' => 35.00, 'cost' => 15.00, 'b2_override' => null],
            ['cat' => $catDrinks->id, 'name' => 'Bottled Water 500ml', 'price' => 25.00, 'cost' => 10.00, 'b2_override' => null],

            // Add-ons
            ['cat' => $catAddons->id, 'name' => 'Boiled Egg', 'price' => 20.00, 'cost' => 8.00, 'b2_override' => null],
            ['cat' => $catAddons->id, 'name' => 'Sunny Side Up', 'price' => 20.00, 'cost' => 8.00, 'b2_override' => null],
            ['cat' => $catAddons->id, 'name' => 'Extra Rice', 'price' => 15.00, 'cost' => 5.00, 'b2_override' => null],
            ['cat' => $catAddons->id, 'name' => 'Extra Soup', 'price' => 5.00, 'cost' => 1.00, 'b2_override' => null],
        ];

        foreach ($catalog as $pData) {
            $product = Product::create([
                'category_id' => $pData['cat'],
                'name' => $pData['name'],
                'base_price' => $pData['price'],
                'cost_price' => $pData['cost'],
                'is_active' => true
            ]);

            // Branch 1 stock (Main Branch - Gateway 1)
            Inventory::create([
                'branch_id' => $branch1->id,
                'product_id' => $product->id,
                'stock_quantity' => 50,
                'price_override' => null,
                'alert_threshold' => 10
            ]);

            // Branch 2 stock (Gateway Branch with price overrides)
            Inventory::create([
                'branch_id' => $branch2->id,
                'product_id' => $product->id,
                'stock_quantity' => 40,
                'price_override' => $pData['b2_override'],
                'alert_threshold' => 10
            ]);
        }
    }
}
