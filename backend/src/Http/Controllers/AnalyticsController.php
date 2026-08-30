<?php

namespace SunmiPos\Backend\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SunmiPos\Backend\Models\Branch;
use SunmiPos\Backend\Models\Order;
use SunmiPos\Backend\Models\OrderItem;
use SunmiPos\Backend\Models\Product;

class AnalyticsController
{
    /**
     * Real-time Multi-Branch Sales Dashboard Overview.
     */
    public function getOverview(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id', 'all');
        $range = $request->query('range', 'today'); // 'today', 'week', 'month', 'custom'

        $dateRange = $this->resolveDateRange($range, $request->query('start_date'), $request->query('end_date'));

        $ordersQuery = Order::where('status', 'completed')
            ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);

        if ($branchId !== 'all') {
            $ordersQuery->where('branch_id', $branchId);
        }

        $orders = $ordersQuery->get();

        $totalGrossRevenue = floatval($orders->sum('total_amount'));
        $totalSalesCount = $orders->count();
        $averageOrderValue = $totalSalesCount > 0 ? round($totalGrossRevenue / $totalSalesCount, 2) : 0.00;

        // Payment method breakdown
        $cashTotal = floatval($orders->where('payment_method', 'cash')->sum('total_amount'));
        $eWalletTotal = floatval($orders->whereIn('payment_method', ['gcash', 'maya'])->sum('total_amount'));
        $cardTotal = floatval($orders->where('payment_method', 'card')->sum('total_amount'));

        // Branch-by-branch comparison
        $branches = Branch::where('is_active', true)->withCount('devices')->get();
        $branchBreakdown = $branches->map(function ($b) use ($dateRange) {
            $bOrders = Order::where('branch_id', $b->id)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
                ->get();

            return [
                'branch_id' => $b->id,
                'name' => $b->name,
                'code' => $b->code,
                'active_devices' => $b->devices_count,
                'total_sales' => floatval($bOrders->sum('total_amount')),
                'order_count' => $bOrders->count()
            ];
        });

        // Top Selling Products
        $orderIds = $orders->pluck('id');
        $topProducts = OrderItem::whereIn('order_id', $orderIds)
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(total_price) as total_revenue'))
            ->groupBy('product_name')
            ->orderBy('total_qty', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'filters' => [
                'branch_id' => $branchId,
                'range' => $range,
                'start_date' => $dateRange['start']->toIso8601String(),
                'end_date' => $dateRange['end']->toIso8601String(),
            ],
            'kpis' => [
                'total_gross_revenue' => $totalGrossRevenue,
                'total_sales_count' => $totalSalesCount,
                'average_order_value' => $averageOrderValue,
                'payment_breakdown' => [
                    'cash' => $cashTotal,
                    'ewallet' => $eWalletTotal,
                    'card' => $cardTotal,
                ]
            ],
            'branch_comparison' => $branchBreakdown,
            'top_products' => $topProducts
        ]);
    }

    private function resolveDateRange(string $range, ?string $customStart, ?string $customEnd): array
    {
        $now = Carbon::now();

        switch ($range) {
            case 'week':
                return [
                    'start' => $now->copy()->startOfWeek(),
                    'end' => $now->copy()->endOfWeek()
                ];
            case 'month':
                return [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth()
                ];
            case 'custom':
                $start = $customStart ? Carbon::parse($customStart)->startOfDay() : $now->copy()->startOfDay();
                $end = $customEnd ? Carbon::parse($customEnd)->endOfDay() : $now->copy()->endOfDay();
                return ['start' => $start, 'end' => $end];
            case 'today':
            default:
                return [
                    'start' => $now->copy()->startOfDay(),
                    'end' => $now->copy()->endOfDay()
                ];
        }
    }
}
