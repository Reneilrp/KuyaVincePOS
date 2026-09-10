import React, { useState } from 'react';
import { DollarSign, ShoppingBag, Building2, Award } from 'lucide-react';
import { AnalyticsData, Branch } from '../types';
import { PaginationControls } from './PaginationControls';

interface Props {
  data: AnalyticsData;
  branches: Branch[];
  lastSyncAt?: string | null;
}

export const SalesOverviewTab: React.FC<Props> = ({ data, branches, lastSyncAt }) => {
  const kpis = data.kpis;
  const activeBranches = branches.filter((b) => b.is_active !== false);
  const activeBranchIds = new Set(activeBranches.map((b) => b.id));
  const visibleComparison = data.branch_comparison.filter((b) => activeBranchIds.has(b.branch_id));
  const [prodPage, setProdPage] = useState<number>(1);
  const PROD_PAGE_SIZE = 5;

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
  const maxBranchSales = Math.max(...visibleComparison.map((b) => b.total_sales), 1);

  return (
    <div className="space-y-6">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Sales</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-2">
            ₱{kpis.total_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Consolidated revenue</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Sales Count</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-2">
            {kpis.total_sales_count} Orders
          </p>
          <p className="text-xs text-slate-500 mt-1">Processed transactions</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Ticket</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-2">
            ₱{kpis.average_order_value.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Per completed sale</p>
        </div>

        {/* Active Branches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {activeBranches.length === 1 ? 'Active Branch' : 'Active Branches'}
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-2">
            {activeBranches.length === 1 ? '1 Branch' : `${activeBranches.length} Branches`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeBranches.length === 1 ? '1 operational branch location' : `${activeBranches.length} operational branch locations`}
          </p>
        </div>
      </div>

      {/* 2. Side-by-Side Dashboard Layout: Top Products (Left ~60%) & Branch Comparison (Right ~40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Top-Selling Products (col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Top-Selling Products by Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest performing menu items across active branches
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-medium">
              {data.top_products.length} Products
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Rank & Product Name</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.top_products.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No sales recorded in this period yet
                    </td>
                  </tr>
                ) : (
                  data.top_products.slice((prodPage - 1) * PROD_PAGE_SIZE, prodPage * PROD_PAGE_SIZE).map((prod, idx) => {
                    const actualRank = (prodPage - 1) * PROD_PAGE_SIZE + idx;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-sm text-slate-900 dark:text-white font-medium">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              actualRank === 0 ? "bg-amber-500 text-white" : actualRank === 1 ? "bg-slate-300 text-slate-800" : actualRank === 2 ? "bg-amber-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              {actualRank + 1}
                            </span>
                            <span>{prod.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-mono text-slate-600 dark:text-slate-300 font-semibold">
                          {prod.total_qty} units
                        </td>
                        <td className="py-3 px-3 text-right text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          ₱{Number(prod.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Top Products Pagination Controls */}
          {data.top_products.length > PROD_PAGE_SIZE && (
            <PaginationControls
              currentPage={prodPage}
              totalItems={data.top_products.length}
              pageSize={PROD_PAGE_SIZE}
              onPageChange={setProdPage}
              itemLabel="ranked products"
            />
          )}
        </div>

        {/* Right Side: Branch Comparison & Revenue Share (col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Branch Comparison
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Revenue share across locations
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
              Synced {formatSyncAge(lastSyncAt)}
            </span>
          </div>

          {visibleComparison.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No active branches to display. Activate a branch in Store Branches Hub.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleComparison.map((branch) => {
                const pct = Math.round((branch.total_sales / maxBranchSales) * 100);
                return (
                  <div
                    key={branch.branch_id}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                          {branch.code}
                        </span>
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                          {branch.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          ₱{branch.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {branch.order_count} {branch.order_count === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{branch.active_devices || 1} Device Online</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{pct}% volume</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
