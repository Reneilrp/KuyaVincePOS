<?php

namespace SunmiPos\Backend\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SunmiPos\Backend\Models\PayrollRecord;
use SunmiPos\Backend\Models\StaffTimeclock;
use SunmiPos\Backend\Models\User;

class PayrollController
{
    /**
     * Calculate and preview payroll for staff within a date period.
     */
    public function calculatePayroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();
        $branchId = $validated['branch_id'] ?? 'all';

        $usersQuery = User::where('is_active', true)->with('branch');
        if ($branchId !== 'all') {
            $usersQuery->where('branch_id', $branchId);
        }
        $users = $usersQuery->get();

        $payrollItems = [];

        foreach ($users as $user) {
            $hoursQuery = StaffTimeclock::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('clock_in_at', [$startDate, $endDate]);

            $totalHours = floatval($hoursQuery->sum('total_hours'));
            $hourlyRate = floatval($user->hourly_rate);
            $grossPay = round($totalHours * $hourlyRate, 2);
            $deductions = 0.00;
            $bonuses = 0.00;
            $netPay = max(0, $grossPay + $bonuses - $deductions);

            $payrollItems[] = [
                'user_id' => $user->id,
                'staff_name' => $user->name,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch ? $user->branch->name : 'All Branches',
                'period_start' => $startDate->toDateString(),
                'period_end' => $endDate->toDateString(),
                'hourly_rate' => $hourlyRate,
                'total_hours' => $totalHours,
                'gross_pay' => $grossPay,
                'deductions' => $deductions,
                'bonuses' => $bonuses,
                'net_pay' => $netPay
            ];
        }

        return response()->json([
            'status' => 'success',
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString()
            ],
            'payroll' => $payrollItems
        ]);
    }

    /**
     * Save/Approve Payroll records.
     */
    public function approvePayroll(Request $request): JsonResponse
    {
        $records = $request->input('records', []);
        $saved = [];

        foreach ($records as $item) {
            $record = PayrollRecord::updateOrCreate(
                [
                    'user_id' => $item['user_id'],
                    'period_start' => $item['period_start'],
                    'period_end' => $item['period_end']
                ],
                [
                    'branch_id' => $item['branch_id'] ?? 1,
                    'hourly_rate' => $item['hourly_rate'],
                    'total_hours_worked' => $item['total_hours'],
                    'gross_pay' => $item['gross_pay'],
                    'deductions' => $item['deductions'] ?? 0.00,
                    'bonuses' => $item['bonuses'] ?? 0.00,
                    'net_pay' => $item['net_pay'],
                    'status' => 'approved'
                ]
            );
            $saved[] = $record;
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Payroll records approved and finalized.',
            'records_count' => count($saved)
        ]);
    }
}
