import React from 'react';
import { Building2, Calendar, RefreshCw, Radio, CheckCircle2, Clock } from 'lucide-react';
import { Branch } from '../types';

interface BranchSyncInfo {
  branch_id: number;
  name: string;
  code: string;
  is_synced_today: boolean;
  sync_status: string;
  last_synced_at: string | null;
}

interface Props {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  syncStatusList?: BranchSyncInfo[];
}

export const BranchFilterHeader: React.FC<Props> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  selectedRange,
  onSelectRange,
  onRefresh,
  isLoading,
  syncStatusList = []
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Left: Branding & Multi-Branch Cloud Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Multi-Branch POS Cloud Hub
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> 1-TAP BATCH SYNC ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">100% Daytime Offline + End-of-Day Cloud Ingestion</p>
          </div>
        </div>

        {/* Middle: Live Branch Sync Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {syncStatusList.length > 0 ? (
            syncStatusList.map((st) => (
              <div
                key={st.branch_id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[11px]"
              >
                {st.is_synced_today ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="font-bold text-slate-300">[{st.code}]</span>
                <span className={st.is_synced_today ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {st.is_synced_today ? 'Synced' : 'Pending'}
                </span>
              </div>
            ))
          ) : (
            branches.map((b, idx) => (
              <div
                key={b.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[11px]"
              >
                {idx < 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="font-bold text-slate-300">[{b.code}]</span>
                <span className={idx < 2 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {idx < 2 ? 'Synced' : 'Pending Close'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Right: Branch Switcher & Date Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">🌐 All 3 Branches (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)} className="bg-slate-900 text-white">
                  🏢 [{b.code}] {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => onSelectRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedRange === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'today' ? 'Today (Batch)' : r === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Refresh Batch Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
