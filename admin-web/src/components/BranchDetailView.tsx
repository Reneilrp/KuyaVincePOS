import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Smartphone,
  MapPin,
  Phone
} from "lucide-react";
import { BranchCashAuditCard } from "./BranchCashAuditCard";
import { BranchStaffManager } from "./BranchStaffManager";
import { BranchZReportModal } from "./BranchZReportModal";
import { Branch, InventoryItem, Product, StaffRecord } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  branch: Branch;
  onBack: () => void;
  masterProducts: Product[];
  branchInventory: InventoryItem[];
  onAssignProduct: (branchId: number, productId: number, stockQty: number) => Promise<void>;
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  batches: any[];
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
  isZReportModalOpen?: boolean;
  onCloseZReportModal?: () => void;
}

export const BranchDetailView: React.FC<Props> = ({
  branch,
  onBack,
  masterProducts,
  branchInventory,
  onAssignProduct,
  onRestock,
  batches,
  staffList,
  onRefreshStaff,
  isZReportModalOpen = false,
  onCloseZReportModal
}) => {
  const { t } = useLanguage();
  const [innerTab, setInnerTab] = useState<"sales" | "inventory" | "staff" | "devices">("sales");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Assign product modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(masterProducts[0]?.id || 1);
  const [assignStockQty, setAssignStockQty] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restock modal
  const [restockProduct, setRestockProduct] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState("20");
  const [restockNotes, setRestockNotes] = useState("Store delivery");

  // Cash audit counted cash
  const [countedCash, setCountedCash] = useState<number | undefined>(undefined);
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Filter batches for this specific branch
  const branchBatches = batches.filter((b) => Number(b.branch_id) === Number(branch.id));

  // Derive cashier-entered count from the latest batch's shift_summary
  const latestBatch = branchBatches[0];
  const cashierCountedCash: number | undefined =
    latestBatch?.shift_summary?.counted_cash !== undefined
      ? Number(latestBatch.shift_summary.counted_cash)
      : undefined;

  // Compute Branch Specific KPIs
  let branchGrossSales = 0;
  let branchOrdersCount = 0;
  let cashSales = 0;
  const itemSalesMap: Record<string, { qty: number; revenue: number }> = {};

  for (const b of branchBatches) {
    branchGrossSales += Number(b.gross_sales || 0);
    branchOrdersCount += Number(b.orders_count || 0);
    cashSales += Number(b.cash_sales || 0);

    if (Array.isArray(b.orders_payload)) {
      for (const ord of b.orders_payload) {
        if (Array.isArray(ord.items)) {
          for (const it of ord.items) {
            const pName = it.name || "Custom Product";
            if (!itemSalesMap[pName]) itemSalesMap[pName] = { qty: 0, revenue: 0 };
            itemSalesMap[pName].qty += Number(it.qty || 1);
            itemSalesMap[pName].revenue += Number(it.total_price || (it.qty * it.unit_price) || 0);
          }
        }
      }
    }
  }

  const assignedItems = branchInventory.filter((item) => (item.branch_stocks[branch.id] ?? 0) >= 0);
  const totalStockOnFloor = assignedItems.reduce((sum, i) => sum + (i.branch_stocks[branch.id] || 0), 0);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !assignStockQty) return;

    setIsSubmitting(true);
    try {
      await onAssignProduct(branch.id, selectedProductId, Number(assignStockQty));
      setIsAssignModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockQty) return;

    setIsSubmitting(true);
    try {
      await onRestock(branch.id, restockProduct.product_id, Number(restockQty), restockNotes);
      setRestockProduct(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Action Notification Banner */}
      {notice && (
        <div className="p-3.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-white/80 hover:text-white text-sm font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 1. Header: Back Button & Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Branches
        </button>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setInnerTab("sales")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              innerTab === "sales"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> {t("cashBalancingTitle")}
          </button>

          <button
            onClick={() => setInnerTab("inventory")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              innerTab === "inventory"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Package className="w-4 h-4" /> {t("stockAtBranch")} ({assignedItems.length})
          </button>

          <button
            onClick={() => setInnerTab("staff")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              innerTab === "staff"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" /> {t("cashierRoster")}
          </button>

          <button
            onClick={() => setInnerTab("devices")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              innerTab === "devices"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Smartphone className="w-4 h-4" /> {t("sunmiTerminal")}
          </button>
        </div>
      </div>

      {/* 2. Branch Tab 1: Sales & Financial Overview + Cash Drawer Reconciliation */}
      {innerTab === "sales" && (
        <div className="space-y-6">
          {/* Time & Specific Date Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">{t("branchPerformancePeriod")}:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["today", "week", "month", "custom"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    dateRange === r
                      ? "bg-blue-600 text-white"
                      : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {r === "today" ? t("today") : r === "week" ? t("thisWeek") : r === "month" ? t("thisMonth") : t("thisYear")}
                </button>
              ))}

              {dateRange === "custom" && (
                <div className="flex items-center gap-2 pl-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 rounded-lg p-1.5"
                  />
                  <span className="text-slate-500 text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 rounded-lg p-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t("totalGrossRevenue")}</span>
              <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">₱{branchGrossSales.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{branch.name} only</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t("totalOrdersCompleted")}</span>
              <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">{branchOrdersCount} Orders</p>
              <p className="text-xs text-slate-500 mt-0.5">Checked out on Sunmi</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t("avgTicketSize")}</span>
              <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                ₱{branchOrdersCount > 0 ? (branchGrossSales / branchOrdersCount).toFixed(2) : "0.00"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Per customer order</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t("floorInventoryStock")}</span>
              <p className="text-xl font-semibold font-mono text-blue-600 dark:text-blue-400 mt-1">{totalStockOnFloor} Units</p>
              <p className="text-xs text-slate-500 mt-0.5">{assignedItems.length} menu items active</p>
            </div>
          </div>

          {/* Cash Drawer Variance Card */}
          <BranchCashAuditCard
            branchName={branch.name}
            cashSales={cashSales}
            openingFloat={1000.0}
            cashierEnteredCash={cashierCountedCash}
            initialCountedCash={countedCash}
            isAdminOverride={isAdminOverride}
            onSaveCountedCash={(val) => setCountedCash(val)}
            onEnableOverride={() => setIsAdminOverride(true)}
          />

          {/* Daily Batch Sync History for this Branch */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              📜 {t("batchHistory")}
            </h3>

            {branchBatches.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                No batches synchronized from this branch yet. When the cashier sends sales on the Sunmi terminal, the audit record will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Sync Date</th>
                      <th className="p-3">Batch ID</th>
                      <th className="p-3">Device Serial</th>
                      <th className="p-3 text-center">Orders</th>
                      <th className="p-3 text-right">Gross Sales</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {branchBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{batch.sync_date}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{batch.batch_id}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{batch.device_serial || "SUNMI-V2S"}</td>
                        <td className="p-3 text-center font-mono">{batch.orders_count}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900 dark:text-white">₱{Number(batch.gross_sales).toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Ingested
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Branch Tab 2: Stock & Commissary at this Branch */}
      {innerTab === "inventory" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Products & Stock at {branch.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select items from your centralized Master Catalog to stock this branch
              </p>
            </div>

            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Assign Product from Master Catalog
            </button>
          </div>

          {assignedItems.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Products Assigned to this Branch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Select an item from the centralized Master Catalog to allocate inventory to this location.
              </p>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Select First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Selling Price</th>
                    <th className="p-3 text-center">Stock at Branch</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {assignedItems.map((item) => {
                    const stock = item.branch_stocks[branch.id] || 0;
                    const isLow = stock <= 10;

                    return (
                      <tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-7 h-7 rounded object-cover bg-slate-100 dark:bg-slate-800" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs">
                                ☕
                              </div>
                            )}
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{item.category}</td>
                        <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">₱{item.base_price.toFixed(2)}</td>
                        <td className="p-3 text-center font-mono font-semibold text-sm text-slate-900 dark:text-white">
                          {stock}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs font-normal ${isLow ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                            {isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setRestockProduct(item);
                              setRestockQty("20");
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors"
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Branch Tab 3: Staff Roster & PIN Access */}
      {innerTab === "staff" && (
        <BranchStaffManager
          branchId={branch.id}
          branchName={branch.name}
          staffList={staffList}
          onRefreshStaff={onRefreshStaff}
          triggerNotice={triggerNotice}
        />
      )}

      {/* 5. Branch Tab 4: Sunmi Terminal & Pairing */}
      {innerTab === "devices" && (
        <div className="space-y-6">
          {/* Branch Profile Card Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-blue-400 flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{branch.name}</h2>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      ({branch.code})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {branch.address || "Zamboanga City"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {branch.phone || "No phone set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-700 dark:text-slate-300">Device: Sunmi V2s</p>
                <p className="text-slate-500">Status: Awaiting First Sync</p>
              </div>
            </div>
          </div>

          {/* Pairing Instructions & Terminal Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Step-by-Step Device Setup
              </span>
              <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside">
                <li>Turn on the Sunmi Handheld terminal.</li>
                <li>Open the <strong className="text-slate-900 dark:text-white">KuyaVince POS</strong> application.</li>
                <li>When prompted for the Branch Import Code, enter:</li>
              </ol>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center">
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">Import Code</span>
                <span className="text-xl font-mono font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                  {branch.import_code || branch.code}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                The Sunmi device will download this branch's assigned menu items and prices in ~1 second.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Terminal Capabilities on Store Floor
              </span>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> 100% Offline Daytime Tap-to-Order
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Automatic 58mm Thermal Receipt Printing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> 1-Tap Closing Cloud Sync
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Physical 58mm Z-Reading Audit Slip
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 6. 58mm Thermal Z-Report Modal */}
      <BranchZReportModal
        visible={isZReportModalOpen}
        onClose={onCloseZReportModal || (() => {})}
        branch={branch}
        grossSales={branchGrossSales}
        ordersCount={branchOrdersCount}
        cashSales={cashSales}
        openingFloat={1000.0}
        countedCash={countedCash}
      />

      {/* 7. Assign Product Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Select Product from Master Catalog
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose an existing item and set the stock units for <span className="text-slate-800 dark:text-slate-200 font-semibold">{branch.name}</span>
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Master Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {masterProducts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">
                      {p.name} — ₱{p.base_price.toFixed(2)} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stock Quantity to Assign</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={assignStockQty}
                  onChange={(e) => setAssignStockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Assigning..." : "Assign to Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Restock: <span className="text-blue-600 dark:text-blue-400">{restockProduct.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Delivering inventory to {branch.name}</p>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Delivery Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Weekly commissary replenishment"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
