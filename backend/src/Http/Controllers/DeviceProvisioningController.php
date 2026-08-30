<?php

namespace SunmiPos\Backend\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Device;

class DeviceProvisioningController
{
    /**
     * Get active branch list for initial Sunmi setup screen.
     */
    public function getBranches(): JsonResponse
    {
        $branches = Branch::where('is_active', true)->select('id', 'name', 'code', 'address')->get();
        return response()->json([
            'status' => 'success',
            'branches' => $branches
        ]);
    }

    /**
     * Provision and pair a Sunmi Handheld Device to a specific branch.
     */
    public function pairDevice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_serial' => 'required|string',
            'branch_id' => 'required|exists:branches,id',
            'terminal_name' => 'required|string',
            'admin_pin' => 'nullable|string'
        ]);

        $device = Device::updateOrCreate(
            ['device_serial' => $validated['device_serial']],
            [
                'branch_id' => $validated['branch_id'],
                'terminal_name' => $validated['terminal_name'],
                'device_token' => 'DVT_' . hash('sha256', $validated['device_serial'] . time()),
                'status' => 'online',
                'last_seen_at' => now()
            ]
        );

        $branch = Branch::find($validated['branch_id']);

        return response()->json([
            'status' => 'success',
            'message' => "Device '{$device->terminal_name}' successfully provisioned and bound to {$branch->name}",
            'device' => $device,
            'branch' => $branch
        ]);
    }

    /**
     * Heartbeat ping from Sunmi device.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $deviceSerial = $request->input('device_serial');
        if ($deviceSerial) {
            Device::where('device_serial', $deviceSerial)->update([
                'status' => 'online',
                'last_seen_at' => now()
            ]);
        }

        return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
    }

    /**
     * List all registered devices for admin web dashboard.
     */
    public function listDevices(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        $query = Device::with('branch');

        if ($branchId && $branchId !== 'all') {
            $query->where('branch_id', $branchId);
        }

        $devices = $query->orderBy('last_seen_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'devices' => $devices
        ]);
    }
}
