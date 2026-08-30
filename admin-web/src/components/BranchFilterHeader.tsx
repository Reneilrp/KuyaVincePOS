import React from 'react';
import { Building2, Calendar, RefreshCw } from 'lucide-react';
import { Branch } from '../types';
import { TabKey } from './SidebarMenuBar';

interface Props {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  pageTitle: string;
  activeTab: TabKey;
}

export const BranchFilterHeader: React.FC<Props> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  selectedRange,
  onSelectRange,
  onRefresh,
  isLoading,
  pageTitle,
  activeTab
}) => {
  // Contextual Filter Visibility Rules:
  // 1. Branch Selector: Show on Sales, Payroll, Reports (where data is branch-specific)
  // 2. Date Filter: Show on Sales, Payroll, Reports (where data is time-bound)
  // 3. Hide all filters on 'branches' and 'inventory' (where you need a clean global catalog/setup view)
  const showBranchFilter = ['sales', 'payroll', 'reports'].includes(activeTab);
  const showDateFilter = ['sales', 'payroll', 'reports'].includes(activeTab);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Page Title */}
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-[11px] text-slate-400">100% Live Supabase PostgreSQL • Zero Mock Data</p>
        </div>

        {/* Right: Contextual Filters (Only appears when relevant) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Dropdown */}
          {showBranchFilter && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">🌐 All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)} className="bg-slate-900 text-white">
                    🏢 {b.name} [{b.import_code || b.code}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Selector */}
          {showDateFilter && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
              {(['today', 'week', 'month'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onSelectRange(r)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    selectedRange === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r === 'today' ? 'Today' : r === 'week' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Sync Latest Supabase Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
