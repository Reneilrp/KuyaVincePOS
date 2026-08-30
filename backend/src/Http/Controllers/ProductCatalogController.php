<?php

namespace SunmiPos\Backend\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\Category;
use SunmiPos\Backend\Models\Inventory;
use SunmiPos\Backend\Models\Product;

class ProductCatalogController
{
    /**
     * Get Catalog for POS Grid with live stock count for specified branch.
     */
    public function getCatalog(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id', 1);

        $categories = Category::all();
        $products = Product::where('is_active', true)
            ->with(['category'])
            ->get()
            ->map(function ($product) use ($branchId) {
                $inv = Inventory::where('branch_id', $branchId)
                    ->where('product_id', $product->id)
                    ->first();

                $stock = $inv ? floatval($inv->stock_quantity) : 0.00;
                $threshold = $inv ? floatval($inv->alert_threshold) : 5.00;

                return [
                    'id' => $product->id,
                    'category_id' => $product->category_id,
                    'category_name' => $product->category ? $product->category->name : 'Uncategorized',
                    'name' => $product->name,
                    'barcode' => $product->barcode,
                    'base_price' => floatval($product->base_price),
                    'cost_price' => floatval($product->cost_price),
                    'image_url' => $product->image_url,
                    'stock' => $stock,
                    'alert_threshold' => $threshold,
                    'is_low_stock' => ($stock <= $threshold),
                    'is_out_of_stock' => ($stock <= 0)
                ];
            });

        return response()->json([
            'status' => 'success',
            'branch_id' => intval($branchId),
            'categories' => $categories,
            'products' => $products
        ]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'barcode' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string'
        ]);

        $product = Product::create($validated);

        return response()->json([
            'status' => 'success',
            'product' => $product
        ], 201);
    }
}
