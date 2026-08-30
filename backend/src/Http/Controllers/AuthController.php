<?php

namespace SunmiPos\Backend\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\User;

class AuthController
{
    /**
     * Cashier fast PIN login on Sunmi device.
     */
    public function cashierPinLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin_code' => 'required|string',
            'branch_id' => 'nullable|exists:branches,id'
        ]);

        $query = User::where('pin_code', $validated['pin_code'])
            ->where('is_active', true);

        if (!empty($validated['branch_id'])) {
            $query->where(function ($q) use ($validated) {
                $q->where('branch_id', $validated['branch_id'])
                  ->orWhereNull('branch_id'); // Admin/floating managers
            });
        }

        $user = $query->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Cashier PIN'
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
            ],
            'token' => 'CSH_' . hash('sha256', $user->id . time())
        ]);
    }

    /**
     * Admin login for Laptop Web Portal.
     */
    public function adminLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        // In production use Hash::check($validated['password'], $user->password)
        if (!$user || ($user->password && $user->password !== $validated['password'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email or password'
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'branch_id' => $user->branch_id
            ],
            'token' => 'ADM_' . hash('sha256', $user->id . time())
        ]);
    }

    /**
     * List staff by branch for 1-tap fast switcher / timeclock.
     */
    public function listStaffByBranch(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        $query = User::where('is_active', true);

        if ($branchId && $branchId !== 'all') {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }

        $staff = $query->select('id', 'name', 'role', 'branch_id', 'hourly_rate')->get();

        return response()->json([
            'status' => 'success',
            'staff' => $staff
        ]);
    }
}
