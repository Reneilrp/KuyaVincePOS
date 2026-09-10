import React, { useState } from "react";
import { Building2, Copy, Check, Plus, Edit2, ChevronRight } from "lucide-react";
import { BranchDetailView } from "./BranchDetailView";
import { AnalyticsData, Branch, InventoryItem, Product, StaffRecord } from "../types";

interface Props {
  branches: Branch[];
  onSaveBranch: (branch: Partial<Branch>) => Promise<void>;
  masterProducts: Product[];
  branchInventory: InventoryItem[];
  analytics: AnalyticsData;
  onAssignProduct: (
    branchId: number,
    assignments: Array<{ productId: number; stockQty: number; priceOverride?: number | null }> | number,
    stockQty?: number,
    priceOverride?: number | null
  ) => Promise<void>;
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  onRemoveProduct?: (branchId: number, productId: number) => Promise<void>;
  batches: any[];
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch | null) => void;
  isZReportOpen: boolean;
  onCloseZReport: () => void;
}

export const BranchSetupManager: React.FC<Props> = ({
  branches,
  onSaveBranch,
  masterProducts,
  branchInventory,
  analytics,
  onAssignProduct,
  onRestock,
  onRemoveProduct,
  batches,
  staffList,
  onRefreshStaff,
  selectedBranch,
  onSelectBranch,
  isZReportOpen,
  onCloseZReport
}) => {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeBranchesCount = branches.filter((b) => b.is_active !== false).length;
  const inactiveBranchesCount = branches.filter((b) => b.is_active === false).length;

  const filteredBranches = branches.filter((b) => {
    if (statusFilter === "active") return b.is_active !== false;
    if (statusFilter === "inactive") return b.is_active === false;
    return true;
  });

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
      address: "Zamboanga City",
      phone: "+63 917 000 0000",
      is_active: true
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    setEditingBranch({ ...branch, is_active: branch.is_active !== false });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name || !editingBranch.import_code) return;

    setIsSubmitting(true);
    try {
      await onSaveBranch({
        ...editingBranch,
        is_active: editingBranch.is_active !== false
      });
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedBranch) {
    return (
      <BranchDetailView
        branch={selectedBranch}
        onBack={() => onSelectBranch(null)}
        masterProducts={masterProducts}
        branchInventory={branchInventory}
        onAssignProduct={onAssignProduct}
        onRestock={onRestock}
        onRemoveProduct={onRemoveProduct}
        batches={batches}
        staffList={staffList}
        onRefreshStaff={onRefreshStaff}
        isZReportModalOpen={isZReportOpen}
        onCloseZReportModal={onCloseZReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Status Filter Tabs and Add Branch Button */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All ({branches.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === "active"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Active ({activeBranchesCount})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === "inactive"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Inactive / Temp ({inactiveBranchesCount})
          </button>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Branch
        </button>
      </div>

      {/* 2. Interactive Branch Cards Grid */}
      {filteredBranches.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
          <Building2 className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {statusFilter === "inactive" ? "No Inactive or Temporary Branches" : "No Branches Found"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === "inactive"
              ? "All store branches are currently active and receiving consolidated sales."
              : "Create your first store branch location to begin terminal pairing."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const isCopied = copiedCode === branch.import_code;
            const isBranchActive = branch.is_active !== false;
            const branchStat = analytics.branch_comparison.find((b) => b.branch_id === branch.id);
            const totalSales = branchStat?.total_sales || 0;
            const totalOrders = branchStat?.order_count || 0;

            const branchItemsCount = branchInventory.filter(
              (i) => (i.branch_stocks[branch.id] ?? 0) > 0
            ).length;

            return (
              <div
                key={branch.id}
                onClick={() => onSelectBranch(branch)}
                className={`bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border rounded-xl p-5 space-y-3 cursor-pointer transition-all group shadow-sm ${
                  isBranchActive
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-dashed border-amber-300 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10 opacity-90"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {branch.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isBranchActive
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {isBranchActive ? "● Active" : "○ Inactive (Temp Closed)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{branch.address || "Zamboanga City"}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick Toggle Status */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveBranch({ ...branch, is_active: !isBranchActive });
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors border ${
                        isBranchActive
                          ? "bg-slate-50 hover:bg-amber-50 dark:bg-slate-950 dark:hover:bg-amber-950/40 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 border-slate-200 dark:border-slate-800"
                          : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      }`}
                      title={isBranchActive ? "Set branch to Inactive/Temporary" : "Re-activate branch"}
                    >
                      {isBranchActive ? "Set Inactive" : "Activate"}
                    </button>

                    <button
                      onClick={(e) => handleOpenEdit(e, branch)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!isBranchActive && (
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span>⚠️ Temporarily Inactive • Hidden from Centralized Sales & Mobile POS</span>
                  </div>
                )}

                {/* Sunmi Mobile Import Code */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="block text-xs text-slate-500">
                      Import Code
                    </span>
                    <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">
                      {branch.import_code || branch.code}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleCopy(e, branch.import_code || branch.code)}
                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 text-xs"
                    title="Copy Import Code"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Quick Card Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block">Sales</span>
                    <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">₱{totalSales.toFixed(0)}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block">Orders</span>
                    <span className="text-xs font-mono font-medium text-slate-900 dark:text-white">{totalOrders}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block">Stocked</span>
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{branchItemsCount} items</span>
                  </div>
                </div>

                {/* Drill-down action bar */}
                <div className="flex items-center justify-between text-xs font-medium text-blue-600 dark:text-blue-400 pt-1">
                  <span>View Branch Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Edit / Add Branch Modal */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingBranch.id ? "Edit Branch" : "Add Branch"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure location, active status, and terminal pairing code</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Branch Operational Status Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Branch Operational Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBranch({ ...editingBranch, is_active: true })}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      editingBranch.is_active !== false
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Active
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Visible in Sales & POS
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBranch({ ...editingBranch, is_active: false })}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      editingBranch.is_active === false
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Inactive / Temp
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hidden from Sales
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name || ""}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  placeholder="e.g. KCC Mall de Zamboanga"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.code || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                    placeholder="e.g. BR-01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Import Code</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.import_code || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, import_code: e.target.value })}
                    placeholder="e.g. KV-BR01"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-blue-600 dark:text-blue-400 font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editingBranch.address || ""}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  placeholder="e.g. Gov. Camins Ave, Zamboanga City"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingBranch.phone || ""}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  placeholder="e.g. +63 917 123 4567"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
