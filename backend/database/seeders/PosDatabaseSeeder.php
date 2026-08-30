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
        // 1. Create 3 Branches
        $branch1 = Branch::create([
            'name' => 'Downtown Flagship',
            'code' => 'BR-01',
            'address' => '101 Rizal Ave, Downtown District',
            'phone' => '+63 917 111 0001',
            'is_active' => true,
            'settings' => ['tax_rate' => 0.12, 'currency' => 'PHP']
        ]);

        $branch2 = Branch::create([
            'name' => 'Mall Galleria',
            'code' => 'BR-02',
            'address' => 'Level 2, West Wing, Galleria Mall',
            'phone' => '+63 917 222 0002',
            'is_active' => true,
            'settings' => ['tax_rate' => 0.12, 'currency' => 'PHP']
        ]);

        $branch3 = Branch::create([
            'name' => 'Express Kiosk',
            'code' => 'BR-03',
            'address' => 'Terminal 3 Station, Transit Hub',
            'phone' => '+63 917 333 0003',
            'is_active' => true,
            'settings' => ['tax_rate' => 0.12, 'currency' => 'PHP']
        ]);

        // 2. Create Users (Admin, Cashiers, Staff)
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
            'name' => 'Maria Santos',
            'email' => 'maria@branch1.local',
            'role' => 'cashier',
            'pin_code' => '1234',
            'hourly_rate' => 85.00,
            'is_active' => true
        ]);

        $cashier2 = User::create([
            'branch_id' => $branch2->id,
            'name' => 'John Dela Cruz',
            'email' => 'john@branch2.local',
            'role' => 'cashier',
            'pin_code' => '5678',
            'hourly_rate' => 85.00,
            'is_active' => true
        ]);

        $cashier3 = User::create([
            'branch_id' => $branch3->id,
            'name' => 'Ana Reyes',
            'email' => 'ana@branch3.local',
            'role' => 'cashier',
            'pin_code' => '4321',
            'hourly_rate' => 80.00,
            'is_active' => true
        ]);

        // 3. Register default Sunmi Devices
        Device::create([
            'branch_id' => $branch1->id,
            'device_serial' => 'SUNMI-V2S-BR01-01',
            'terminal_name' => 'Branch 1 - Counter 01',
            'device_token' => 'DVT_SUNMI_BR01_01',
            'status' => 'online',
            'last_seen_at' => now()
        ]);

        Device::create([
            'branch_id' => $branch2->id,
            'device_serial' => 'SUNMI-V2S-BR02-01',
            'terminal_name' => 'Branch 2 - Counter 01',
            'device_token' => 'DVT_SUNMI_BR02_01',
            'status' => 'online',
            'last_seen_at' => now()
        ]);

        Device::create([
            'branch_id' => $branch3->id,
            'device_serial' => 'SUNMI-V2S-BR03-01',
            'terminal_name' => 'Branch 3 - Mobile Kiosk',
            'device_token' => 'DVT_SUNMI_BR03_01',
            'status' => 'online',
            'last_seen_at' => now()
        ]);

        // 4. Create Categories
        $catBeverages = Category::create(['name' => 'Coffee & Drinks', 'color' => '#3B82F6', 'icon' => 'coffee']);
        $catPastries = Category::create(['name' => 'Bakery & Pastries', 'color' => '#F59E0B', 'icon' => 'cake']);
        $catMeals = Category::create(['name' => 'Hot Meals', 'color' => '#EF4444', 'icon' => 'utensils']);
        $catSnacks = Category::create(['name' => 'Quick Snacks', 'color' => '#10B981', 'icon' => 'cookie']);

        // 5. Create Products
        $products = [
            ['cat' => $catBeverages->id, 'name' => 'Iced Caramel Macchiato', 'price' => 145.00, 'cost' => 45.00, 'b1' => 80, 'b2' => 50, 'b3' => 30],
            ['cat' => $catBeverages->id, 'name' => 'Spanish Latte (Cold)', 'price' => 135.00, 'cost' => 40.00, 'b1' => 100, 'b2' => 75, 'b3' => 40],
            ['cat' => $catBeverages->id, 'name' => 'Americano Espresso', 'price' => 95.00, 'cost' => 20.00, 'b1' => 120, 'b2' => 90, 'b3' => 60],
            ['cat' => $catPastries->id, 'name' => 'Butter Croissant', 'price' => 85.00, 'cost' => 30.00, 'b1' => 35, 'b2' => 20, 'b3' => 15],
            ['cat' => $catPastries->id, 'name' => 'Chocolate Lava Muffin', 'price' => 95.00, 'cost' => 35.00, 'b1' => 25, 'b2' => 18, 'b3' => 10],
            ['cat' => $catPastries->id, 'name' => 'Cheese Ensaymada', 'price' => 75.00, 'cost' => 25.00, 'b1' => 40, 'b2' => 30, 'b3' => 20],
            ['cat' => $catMeals->id, 'name' => 'Beef Tapa Rice Bowl', 'price' => 180.00, 'cost' => 70.00, 'b1' => 50, 'b2' => 35, 'b3' => 0], // out of stock at Kiosk
            ['cat' => $catMeals->id, 'name' => 'Chicken Teriyaki Bowl', 'price' => 165.00, 'cost' => 60.00, 'b1' => 45, 'b2' => 40, 'b3' => 0],
            ['cat' => $catSnacks->id, 'name' => 'Truffle Fries', 'price' => 120.00, 'cost' => 40.00, 'b1' => 60, 'b2' => 40, 'b3' => 25],
        ];

        foreach ($products as $pData) {
            $product = Product::create([
                'category_id' => $pData['cat'],
                'name' => $pData['name'],
                'base_price' => $pData['price'],
                'cost_price' => $pData['cost'],
                'is_active' => true
            ]);

            // Branch 1 stock
            Inventory::create([
                'branch_id' => $branch1->id,
                'product_id' => $product->id,
                'stock_quantity' => $pData['b1'],
                'alert_threshold' => 10
            ]);

            // Branch 2 stock
            Inventory::create([
                'branch_id' => $branch2->id,
                'product_id' => $product->id,
                'stock_quantity' => $pData['b2'],
                'alert_threshold' => 10
            ]);

            // Branch 3 stock
            Inventory::create([
                'branch_id' => $branch3->id,
                'product_id' => $product->id,
                'stock_quantity' => $pData['b3'],
                'alert_threshold' => 5
            ]);
        }
    }
}
