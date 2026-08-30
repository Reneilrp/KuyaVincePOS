import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Smartphone, Award, CreditCard, Banknote, QrCode } from 'lucide-react';
import { AnalyticsData, Branch } from '../types';

interface Props {
  data: AnalyticsData;
  branches: Branch[];
}

export const SalesOverviewTab: React.FC<Props> = ({ data, branches }) => {
  const kpis = data.kpis;
  const maxBranchSales = Math.max(...data.branch_comparison.map((b) => b.total_sales), 1);

  return (
    <div className="space-y-6">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">₱{kpis.total_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Real-time active register feed
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Count</span>
            <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{kpis.total_sales_count} Orders</p>
          <p className="text-xs text-slate-400 mt-1">Processed on Sunmi terminals</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Ticket</span>
            <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">₱{kpis.average_order_value.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Per completed transaction</p>
        </div>

        {/* Active Sunmi Devices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sunmi Terminals</span>
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{branches.length} Active</p>
          <p className="text-xs text-amber-400 mt-1">Across 3 branches</p>
        </div>
      </div>

      {/* 2. Side-by-Side 3-Branch Performance Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            🏢 Side-by-Side Branch Comparison
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.branch_comparison.map((branch) => {
            const pct = Math.round((branch.total_sales / maxBranchSales) * 100);
            return (
              <div key={branch.branch_id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase px-2 py-0.5 rounded bg-blue-950/80 border border-blue-900/60">
                      {branch.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 mt-1">{branch.name}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{branch.order_count} Sales</span>
                </div>

                <p className="text-xl font-bold text-emerald-400 mt-2">
                  ₱{branch.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>📱 {branch.active_devices || 1} Device Online</span>
                  <span>{pct}% of top branch</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Payment Methods & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            💳 Payment Method Mix
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-950 text-emerald-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Cash Payments</p>
                  <p className="text-xs text-slate-400">Physical Register Drawer</p>
                </div>
              </div>
              <p className="text-sm font-bold text-white">₱{kpis.payment_breakdown.cash.toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-950 text-blue-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">E-Wallets (GCash / Maya)</p>
                  <p className="text-xs text-slate-400">QR Standee Scans</p>
                </div>
              </div>
              <p className="text-sm font-bold text-white">₱{kpis.payment_breakdown.ewallet.toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-950 text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Cards / Debit</p>
                  <p className="text-xs text-slate-400">Terminal Swipes</p>
                </div>
              </div>
              <p className="text-sm font-bold text-white">₱{kpis.payment_breakdown.card.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Top-Selling Products */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            🏆 Top-Selling Products by Volume
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.top_products.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">No sales recorded in this period yet</td>
                  </tr>
                ) : (
                  data.top_products.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        {prod.product_name}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-400">{prod.total_qty} units</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">₱{Number(prod.total_revenue).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
