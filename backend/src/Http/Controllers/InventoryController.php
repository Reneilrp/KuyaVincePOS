<?php

namespace SunmiPos\Backend\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\InventoryAdjustment;
use SunmiPos\Backend\Models\Product;

class InventoryController
{
    /**
     * Cross-Branch Inventory Matrix for Admin Laptop Dashboard.
     */
    public function getMultiBranchMatrix(Request $request): JsonResponse
    {
        $branches = Branch::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with('category')->get();

        $matrix = $products->map(function ($product) use ($branches) {
            $branchStocks = [];
            $totalStock = 0;

            foreach ($branches as $branch) {
                $inv = Inventory::where('branch_id', $branch->id)
                    ->where('product_id', $product->id)
                    ->first();
                $qty = $inv ? floatval($inv->stock_quantity) : 0.00;
                $branchStocks[$branch->id] = $qty;
                $totalStock += $qty;
            }

            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'category' => $product->category ? $product->category->name : 'General',
                'base_price' => floatval($product->base_price),
                'cost_price' => floatval($product->cost_price),
                'branch_stocks' => $branchStocks,
                'total_stock' => $totalStock
            ];
        });

        return response()->json([
            'status' => 'success',
            'branches' => $branches,
            'matrix' => $matrix
        ]);
    }

    /**
     * Restock items per branch atomically.
     */
    public function restock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated) {
            $inv = Inventory::where('branch_id', $validated['branch_id'])
                ->where('product_id', $validated['product_id'])
                ->lockForUpdate()
                ->first();

            if (!$inv) {
                $inv = Inventory::create([
                    'branch_id' => $validated['branch_id'],
                    'product_id' => $validated['product_id'],
                    'stock_quantity' => 0,
                    'alert_threshold' => 5
                ]);
            }

            $inv->stock_quantity += floatval($validated['quantity']);
            $inv->save();

            InventoryAdjustment::create([
                'branch_id' => $validated['branch_id'],
                'product_id' => $validated['product_id'],
                'user_id' => $validated['user_id'] ?? null,
                'type' => 'restock',
                'quantity_change' => floatval($validated['quantity']),
                'stock_after' => $inv->stock_quantity,
                'notes' => $validated['notes'] ?? 'Stock Replenishment'
            ]);

            $product = Product::find($validated['product_id']);
            $branch = Branch::find($validated['branch_id']);

            return response()->json([
                'status' => 'success',
                'message' => "Restocked {$validated['quantity']} units of '{$product->name}' at {$branch->name}",
                'current_stock' => $inv->stock_quantity
            ]);
        });
    }

    /**
     * Adjust stock for spoilage, damage, or audit.
     */
    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'product_id' => 'required|exists:products,id',
            'quantity_change' => 'required|numeric', // negative for spoilage, positive for found
            'type' => 'required|in:spoilage,damaged,audit,transfer',
            'user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated) {
            $inv = Inventory::where('branch_id', $validated['branch_id'])
                ->where('product_id', $validated['product_id'])
                ->lockForUpdate()
                ->first();

            if (!$inv) {
                throw new Exception("Inventory record does not exist for this product and branch.");
            }

            $newStock = $inv->stock_quantity + floatval($validated['quantity_change']);
            if ($newStock < 0) {
                throw new Exception("Adjustment would result in negative stock.");
            }

            $inv->stock_quantity = $newStock;
            $inv->save();

            InventoryAdjustment::create([
                'branch_id' => $validated['branch_id'],
                'product_id' => $validated['product_id'],
                'user_id' => $validated['user_id'] ?? null,
                'type' => $validated['type'],
                'quantity_change' => floatval($validated['quantity_change']),
                'stock_after' => $inv->stock_quantity,
                'notes' => $validated['notes']
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Inventory adjusted successfully ({$validated['type']})",
                'current_stock' => $inv->stock_quantity
            ]);
        });
    }
}
