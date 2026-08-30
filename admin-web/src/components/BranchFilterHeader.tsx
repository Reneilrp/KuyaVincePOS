import React from 'react';
import { Building2, Calendar, RefreshCw, Printer, ArrowLeft } from 'lucide-react';
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
  activeBranchDetail?: Branch | null;
  onBackFromBranch?: () => void;
  onOpenZReport?: () => void;
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
  activeTab,
  activeBranchDetail,
  onBackFromBranch,
  onOpenZReport
}) => {
  const showBranchFilter = !activeBranchDetail && ['sales', 'payroll', 'reports'].includes(activeTab);
  const showDateFilter = !activeBranchDetail && ['sales', 'payroll', 'reports'].includes(activeTab);

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Dynamic Page Title & Back Button */}
        <div className="flex items-center gap-3">
          {activeBranchDetail && onBackFromBranch && (
            <button
              onClick={onBackFromBranch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition shadow-sm"
              title="Back to All Branches"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}

          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {activeBranchDetail ? `🏢 ${activeBranchDetail.name}` : pageTitle}
              {activeBranchDetail && (
                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-mono font-bold">
                  {activeBranchDetail.import_code || activeBranchDetail.code}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400">
              {activeBranchDetail
                ? `📍 ${activeBranchDetail.address || 'Zamboanga City'} • Branch Dashboard`
                : '100% Live Supabase PostgreSQL • Zero Mock Data'}
            </p>
          </div>
        </div>

        {/* Right: Contextual Actions & Z-Report Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Top-Right Print 58mm Daily Z-Report (When inside a branch) */}
          {activeBranchDetail && onOpenZReport && (
            <button
              onClick={onOpenZReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
              title="Print 58mm Daily Audit Slip"
            >
              <Printer className="w-3.5 h-3.5" /> Print 58mm Daily Z-Report
            </button>
          )}

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
