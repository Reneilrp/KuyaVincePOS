<?php

namespace SunmiPos\Backend\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\Branch;

class BranchController
{
    public function index(): JsonResponse
    {
        $branches = Branch::withCount(['devices', 'orders'])->get();
        return response()->json([
            'status' => 'success',
            'branches' => $branches
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:branches,code|max:50',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'settings' => 'nullable|array'
        ]);

        $branch = Branch::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Branch created successfully',
            'branch' => $branch
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $branch = Branch::with(['devices', 'inventories.product'])->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'branch' => $branch
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'settings' => 'nullable|array'
        ]);

        $branch->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Branch updated successfully',
            'branch' => $branch
        ]);
    }
}
