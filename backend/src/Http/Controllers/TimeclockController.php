<?php

namespace SunmiPos\Backend\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\StaffTimeclock;
use SunmiPos\Backend\Models\User;

class TimeclockController
{
    /**
     * Staff Clock In via PIN or ID on Sunmi Handheld.
     */
    public function clockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'device_id' => 'nullable|exists:devices,id',
            'notes' => 'nullable|string'
        ]);

        // Check if already active
        $active = StaffTimeclock::where('user_id', $validated['user_id'])
            ->where('status', 'active')
            ->first();

        if ($active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Staff is already clocked in since ' . $active->clock_in_at->format('H:i')
            ], 422);
        }

        $timeclock = StaffTimeclock::create([
            'user_id' => $validated['user_id'],
            'branch_id' => $validated['branch_id'],
            'device_id' => $validated['device_id'] ?? null,
            'clock_in_at' => now(),
            'status' => 'active',
            'notes' => $validated['notes'] ?? null
        ]);

        $user = User::find($validated['user_id']);

        return response()->json([
            'status' => 'success',
            'message' => "{$user->name} clocked in at " . now()->format('H:i:s'),
            'timeclock' => $timeclock
        ], 201);
    }

    /**
     * Staff Clock Out and compute total hours worked.
     */
    public function clockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'notes' => 'nullable|string'
        ]);

        $active = StaffTimeclock::where('user_id', $validated['user_id'])
            ->where('status', 'active')
            ->orderBy('clock_in_at', 'desc')
            ->first();

        if (!$active) {
            return response()->json([
                'status' => 'error',
                'message' => 'No active clock-in session found for this staff member.'
            ], 404);
        }

        $now = now();
        $hoursWorked = round($active->clock_in_at->diffInMinutes($now) / 60, 2);

        $active->clock_out_at = $now;
        $active->total_hours = $hoursWorked;
        $active->status = 'completed';
        if (!empty($validated['notes'])) {
            $active->notes = ($active->notes ? $active->notes . ' | ' : '') . $validated['notes'];
        }
        $active->save();

        $user = User::find($validated['user_id']);

        return response()->json([
            'status' => 'success',
            'message' => "{$user->name} clocked out. Shift duration: {$hoursWorked} hours.",
            'timeclock' => $active
        ]);
    }

    /**
     * Active staff on duty for Admin Dashboard.
     */
    public function getActiveStaff(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        $query = StaffTimeclock::where('status', 'active')->with(['user', 'branch']);

        if ($branchId && $branchId !== 'all') {
            $query->where('branch_id', $branchId);
        }

        $active = $query->get();

        return response()->json([
            'status' => 'success',
            'active_staff' => $active
        ]);
    }
}
