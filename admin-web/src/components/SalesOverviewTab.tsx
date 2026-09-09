import React from 'react';
import { DollarSign, ShoppingBag, Smartphone, Award } from 'lucide-react';
import { AnalyticsData, Branch } from '../types';

interface Props {
  data: AnalyticsData;
  branches: Branch[];
  lastSyncAt?: string | null;
}

export const SalesOverviewTab: React.FC<Props> = ({ data, branches, lastSyncAt }) => {
  const kpis = data.kpis;

  const formatSyncAge = (isoStr?: string | null): string => {
    if (!isoStr) return 'No syncs yet';
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };
  const maxBranchSales = Math.max(...data.branch_comparison.map((b) => b.total_sales), 1);

  return (
    <div className="space-y-6">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gross Sales</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-white mt-2">
            ₱{kpis.total_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Consolidated revenue</p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Sales Count</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-white mt-2">
            {kpis.total_sales_count} Orders
          </p>
          <p className="text-xs text-slate-500 mt-1">Processed transactions</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Average Ticket</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-white mt-2">
            ₱{kpis.average_order_value.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Per completed sale</p>
        </div>

        {/* Active Sunmi Devices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Terminals</span>
            <Smartphone className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-white mt-2">
            {branches.length} Terminals
          </p>
          <p className="text-xs text-slate-500 mt-1">Across {branches.length} branches</p>
        </div>
      </div>

      {/* 2. Side-by-Side Branch Performance Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Branch Comparison
          </h2>
          <span className="text-xs text-slate-400">
            Synced {formatSyncAge(lastSyncAt)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.branch_comparison.map((branch) => {
            const pct = Math.round((branch.total_sales / maxBranchSales) * 100);
            return (
              <div key={branch.branch_id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium font-mono text-slate-400">
                      {branch.code}
                    </span>
                    <h3 className="text-sm font-medium text-white">{branch.name}</h3>
                  </div>
                  <span className="text-xs text-slate-400">{branch.order_count} orders</span>
                </div>

                <p className="text-base font-semibold font-mono text-white">
                  ₱{branch.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{branch.active_devices || 1} Device</span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Top Selling Products */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">
          Top-Selling Products by Volume
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-xs font-medium text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Product Name</th>
                <th className="py-2.5 px-4 text-center">Units Sold</th>
                <th className="py-2.5 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.top_products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500">No sales recorded in this period yet</td>
                </tr>
              ) : (
                data.top_products.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-sm text-white font-normal">
                      <span className="text-xs text-slate-500 mr-2 font-mono">{idx + 1}.</span>
                      {prod.product_name}
                    </td>
                    <td className="py-3 px-4 text-center text-sm font-mono text-slate-300">{prod.total_qty} units</td>
                    <td className="py-3 px-4 text-right text-sm font-mono font-medium text-white">₱{Number(prod.total_revenue).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
