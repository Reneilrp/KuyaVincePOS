import React, { useState } from 'react';
import { Building2, Copy, Check, Plus, Edit2, ChevronRight } from 'lucide-react';
import { BranchDetailView } from './BranchDetailView';
import { AnalyticsData, Branch, InventoryItem, Product, StaffRecord } from '../types';

interface Props {
  branches: Branch[];
  onSaveBranch: (branch: Partial<Branch>) => Promise<void>;
  masterProducts: Product[];
  branchInventory: InventoryItem[];
  analytics: AnalyticsData;
  onAssignProduct: (branchId: number, productId: number, stockQty: number) => Promise<void>;
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  batches: any[];
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
}

export const BranchSetupManager: React.FC<Props> = ({
  branches,
  onSaveBranch,
  masterProducts,
  branchInventory,
  analytics,
  onAssignProduct,
  onRestock,
  batches,
  staffList,
  onRefreshStaff
}) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleOpenNew = () => {
    const nextNum = branches.length + 1;
    setEditingBranch({
      name: `Branch ${nextNum} - Zamboanga`,
      code: `BR-0${nextNum}`,
      import_code: `KV-BR0${nextNum}`,
      address: 'Zamboanga City',
      phone: '+63 917 000 0000',
      is_active: true
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    setEditingBranch({ ...branch });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name || !editingBranch.import_code) return;

    setIsSubmitting(true);
    try {
      await onSaveBranch(editingBranch);
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a branch is clicked, drill down to its dedicated Branch Detail View (AccommoTrack-M style)
  if (selectedBranch) {
    return (
      <BranchDetailView
        branch={selectedBranch}
        onBack={() => setSelectedBranch(null)}
        masterProducts={masterProducts}
        branchInventory={branchInventory}
        onAssignProduct={onAssignProduct}
        onRestock={onRestock}
        batches={batches}
        staffList={staffList}
        onRefreshStaff={onRefreshStaff}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Branch button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            🏢 Store Branches Hub
          </h2>
          <p className="text-xs text-slate-400">
            Click on any branch card to view its sales, cash drawer variance, cashier roster, live stock, and print 58mm Z-Reports
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Branch
        </button>
      </div>

      {/* 2. Interactive Clickable Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map((branch) => {
          const isCopied = copiedCode === branch.import_code;
          const branchStat = analytics.branch_comparison.find((b) => b.branch_id === branch.id);
          const totalSales = branchStat?.total_sales || 0;
          const totalOrders = branchStat?.order_count || 0;

          // Count products with stock at this branch
          const branchItemsCount = branchInventory.filter(
            (i) => (i.branch_stocks[branch.id] ?? 0) > 0
          ).length;

          return (
            <div
              key={branch.id}
              onClick={() => setSelectedBranch(branch)}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/60 rounded-2xl p-6 shadow-sm space-y-4 cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-950/80 border border-blue-900 flex items-center justify-center text-blue-400 font-bold text-xl group-hover:scale-105 transition">
                    🏢
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-slate-400">{branch.address || 'Zamboanga City'}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleOpenEdit(e, branch)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Edit Branch Information"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sunmi Mobile Import Code Highlight */}
              <div className="bg-slate-950 border border-slate-800 group-hover:border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    Sunmi Import Code
                  </span>
                  <span className="text-base font-mono font-black text-blue-400 tracking-wider">
                    {branch.import_code || branch.code}
                  </span>
                </div>
                <button
                  onClick={(e) => handleCopy(e, branch.import_code || branch.code)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-semibold"
                  title="Copy Import Code"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Quick Card Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold block">SALES</span>
                  <span className="text-xs font-bold text-emerald-400">₱{totalSales.toFixed(0)}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold block">ORDERS</span>
                  <span className="text-xs font-bold text-white">{totalOrders}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold block">ITEMS</span>
                  <span className="text-xs font-bold text-blue-400">{branchItemsCount} Stocked</span>
                </div>
              </div>

              {/* Drill-down action bar */}
              <div className="flex items-center justify-between text-xs font-bold text-blue-400 pt-1 group-hover:translate-x-0.5 transition">
                <span>Open Branch Dashboard & Audit</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Edit / Add Branch Modal */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🏢 {editingBranch.id ? 'Edit Branch Details' : 'Create New Branch'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure branch location and its Sunmi mobile pairing code</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  placeholder="e.g. KCC Mall de Zamboanga"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.code || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                    placeholder="e.g. BR-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Sunmi Import Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.import_code || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, import_code: e.target.value })}
                    placeholder="e.g. KV-BR01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Address / Location</label>
                <input
                  type="text"
                  value={editingBranch.address || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  placeholder="e.g. Gov. Camins Ave, Zamboanga City"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingBranch.phone || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  placeholder="e.g. +63 917 123 4567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
