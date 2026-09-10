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
  Phone,
  Search,
  X,
  Eye,
  Check,
  Trash2
} from "lucide-react";
import { BranchCashAuditCard } from "./BranchCashAuditCard";
import { BranchStaffManager } from "./BranchStaffManager";
import { BranchZReportModal } from "./BranchZReportModal";
import { PaginationControls } from "./PaginationControls";
import { Branch, InventoryItem, Product, StaffRecord } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  branch: Branch;
  onBack: () => void;
  masterProducts: Product[];
  branchInventory: InventoryItem[];
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
  onRemoveProduct,
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
  const [batchPage, setBatchPage] = useState<number>(1);
  const [stockPage, setStockPage] = useState<number>(1);
  const BATCH_PAGE_SIZE = 8;
  const STOCK_PAGE_SIZE = 10;

  // Assign product modal state (Multi-Select & Bulk Assignment)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [customPrices, setCustomPrices] = useState<Record<number, string>>({});
  const [customStocks, setCustomStocks] = useState<Record<number, string>>({});
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [assignSelectedCategory, setAssignSelectedCategory] = useState("ALL");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restock modal
  const [restockProduct, setRestockProduct] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState("20");
  const [restockNotes, setRestockNotes] = useState("Store delivery");
  const [productToRemove, setProductToRemove] = useState<InventoryItem | null>(null);

  // Cash audit counted cash
  const [countedCash, setCountedCash] = useState<number | undefined>(undefined);
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Open Assign Modal with pre-populated stock and prices
  const handleOpenAssignModal = () => {
    const initialSelected = new Set<number>();
    const initialPrices: Record<number, string> = {};
    const initialStocks: Record<number, string> = {};

    masterProducts.forEach((p) => {
      const invItem = branchInventory.find((i) => i.product_id === p.id);
      const isAssigned = invItem
        ? invItem.branch_stocks[branch.id] !== undefined && !invItem.excluded_branch_ids?.includes(branch.id)
        : false;
      const stock = invItem ? (invItem.branch_stocks[branch.id] ?? 50) : 50;
      const price =
        invItem?.branch_prices && invItem.branch_prices[branch.id] !== undefined && invItem.branch_prices[branch.id] !== null
          ? invItem.branch_prices[branch.id]
          : p.base_price;

      initialPrices[p.id] = String(price ?? p.base_price ?? 0);
      initialStocks[p.id] = String(isAssigned ? stock : 50);

      if (isAssigned) {
        initialSelected.add(p.id);
      }
    });

    setSelectedProductIds(initialSelected);
    setCustomPrices(initialPrices);
    setCustomStocks(initialStocks);
    setAssignSearchQuery("");
    setAssignSelectedCategory("ALL");
    setShowOnlySelected(false);
    setIsAssignModalOpen(true);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const categories = ["ALL", ...Array.from(new Set(masterProducts.map((p) => p.category || "Uncategorized")))];

  const filteredAssignProducts = masterProducts.filter((p) => {
    const q = assignSearchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));

    const matchesCategory =
      assignSelectedCategory === "ALL" || p.category === assignSelectedCategory;

    const matchesSelected = !showOnlySelected || selectedProductIds.has(p.id);

    return matchesSearch && matchesCategory && matchesSelected;
  });

  const handleSelectAllVisible = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredAssignProducts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  const handleBulkAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductIds.size === 0) {
      alert("Please select at least one product to assign to this branch.");
      return;
    }

    setIsSubmitting(true);
    try {
      const assignments = Array.from(selectedProductIds).map((pId) => {
        const stock = Number(customStocks[pId] ?? 50);
        const priceStr = customPrices[pId];
        const prod = masterProducts.find((p) => p.id === pId);
        const priceVal = priceStr !== undefined && priceStr !== "" ? Number(priceStr) : (prod?.base_price ?? null);

        return {
          productId: pId,
          stockQty: isNaN(stock) ? 50 : stock,
          priceOverride: isNaN(Number(priceVal)) ? null : Number(priceVal)
        };
      });

      await onAssignProduct(branch.id, assignments);
      setIsAssignModalOpen(false);
      triggerNotice(`Successfully assigned ${assignments.length} product(s) to ${branch.name}`);
    } catch (err: any) {
      alert("Assignment failed: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
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

  const assignedItems = branchInventory.filter(
    (item) => item.branch_stocks[branch.id] !== undefined && !item.excluded_branch_ids?.includes(branch.id)
  );
  const totalStockOnFloor = assignedItems.reduce((sum, i) => sum + (i.branch_stocks[branch.id] || 0), 0);

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
              <>
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
                      {branchBatches.slice((batchPage - 1) * BATCH_PAGE_SIZE, batchPage * BATCH_PAGE_SIZE).map((batch) => (
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

                {/* Batch Pagination Controls */}
                <PaginationControls
                  currentPage={batchPage}
                  totalItems={branchBatches.length}
                  pageSize={BATCH_PAGE_SIZE}
                  onPageChange={setBatchPage}
                  itemLabel="daily batch logs"
                />
              </>
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
                Products at {branch.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage products available at this branch, set prices, and monitor stock
              </p>
            </div>

            <button
              onClick={handleOpenAssignModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Assign Products from Master Catalog
            </button>
          </div>

          {assignedItems.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Products Assigned to this Branch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Select items from the centralized Master Catalog to allocate inventory and set custom branch prices.
              </p>
              <button
                onClick={handleOpenAssignModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Select Products from Catalog
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Branch Selling Price</th>
                      <th className="p-3 text-center">Stock Quantity</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {assignedItems.slice((stockPage - 1) * STOCK_PAGE_SIZE, stockPage * STOCK_PAGE_SIZE).map((item) => {
                      const stock = item.branch_stocks[branch.id] || 0;
                      const isLow = stock <= 10;
                      const branchPrice =
                        item.branch_prices && item.branch_prices[branch.id] !== undefined && item.branch_prices[branch.id] !== null
                          ? item.branch_prices[branch.id]
                          : item.base_price;
                      const hasOverride =
                        item.branch_prices &&
                        item.branch_prices[branch.id] !== undefined &&
                        item.branch_prices[branch.id] !== null &&
                        item.branch_prices[branch.id] !== item.base_price;

                      return (
                        <tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              {item.image_url ? (
                                <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm">
                                  🍲
                                </div>
                              )}
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{item.category}</td>
                          <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span>₱{Number(branchPrice).toFixed(2)}</span>
                              {hasOverride && (
                                <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  Custom
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-sm text-slate-900 dark:text-white">
                            {stock}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-xs font-normal ${isLow ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                              {isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setRestockProduct(item);
                                  setRestockQty("20");
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                              >
                                + Restock
                              </button>
                              {onRemoveProduct && (
                                <button
                                  type="button"
                                  onClick={() => setProductToRemove(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium transition-colors border border-slate-200/60 dark:border-slate-700/60"
                                  title={`Remove ${item.name} from this branch`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Branch Stock Pagination Controls */}
              <PaginationControls
                currentPage={stockPage}
                totalItems={assignedItems.length}
                pageSize={STOCK_PAGE_SIZE}
                onPageChange={setStockPage}
                itemLabel="branch products"
              />
            </>
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

      {/* 7. Assign Product Modal (Wide Multi-Select & Bulk Assignment) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl sm:max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/75 dark:bg-slate-950/75">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Assign Products from Master Catalog
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {branch.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select products, customize branch selling prices, and allocate initial stock quantities for this location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    placeholder="Search master products by name, category, or barcode..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {assignSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAssignSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* View All Selected Filter Toggle & Bulk Check buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                      showOnlySelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Selected ({selectedProductIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Select All Visible
                  </button>

                  {selectedProductIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAssignSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      assignSelectedCategory === cat
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat === "ALL" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Product List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/50 min-h-[260px] max-h-[50vh] sm:max-h-[55vh]">
              {filteredAssignProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {showOnlySelected ? "No products currently selected" : "No matching master products found"}
                  </p>
                  <p className="text-xs">
                    {showOnlySelected
                      ? "Turn off 'View Selected' filter to browse all catalog items."
                      : "Try adjusting your search terms or category filter."}
                  </p>
                </div>
              ) : (
                filteredAssignProducts.map((p) => {
                  const isSelected = selectedProductIds.has(p.id);
                  const currentPrice = customPrices[p.id] !== undefined ? customPrices[p.id] : String(p.base_price);
                  const currentStock = customStocks[p.id] !== undefined ? customStocks[p.id] : "50";
                  const isPriceOverridden =
                    currentPrice !== "" && Number(currentPrice) !== p.base_price && !isNaN(Number(currentPrice));

                  return (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName === "INPUT") return;
                        toggleProductSelection(p.id);
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Left: Checkbox + 20x20 picture + Product Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelection(p.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                        />

                        {/* 20x20 picture / thumbnail container */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg select-none">
                              {p.category?.toLowerCase().includes("beef") ? "🥩" :
                               p.category?.toLowerCase().includes("chicken") ? "🍗" :
                               p.category?.toLowerCase().includes("fish") ? "🐟" :
                               p.category?.toLowerCase().includes("drink") ? "🥤" :
                               p.category?.toLowerCase().includes("noodle") ? "🍜" :
                               p.category?.toLowerCase().includes("sausage") ? "🌭" :
                               p.category?.toLowerCase().includes("meal") ? "🍱" : "🍲"}
                            </span>
                          )}
                        </div>

                        {/* Product Name & Category */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {p.category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>
                              Master Base: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">₱{p.base_price.toFixed(2)}</span>
                            </span>
                            {isSelected && isPriceOverridden && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                Custom Price Override
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Editable Price & Editable Stock Quantity in one row */}
                      <div
                        className="flex items-center gap-3 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Branch Selling Price */}
                        <div className="w-32 sm:w-36">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Branch Selling Price (₱)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">₱</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentPrice}
                              onChange={(e) => {
                                setCustomPrices((prev) => ({ ...prev, [p.id]: e.target.value }));
                                if (!selectedProductIds.has(p.id)) {
                                  setSelectedProductIds((prev) => new Set(prev).add(p.id));
                                }
                              }}
                              className="w-full pl-6 pr-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Stock Quantity */}
                        <div className="w-24 sm:w-28">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 text-center">
                            Stock Units
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => {
                              setCustomStocks((prev) => ({ ...prev, [p.id]: e.target.value }));
                              if (!selectedProductIds.has(p.id)) {
                                setSelectedProductIds((prev) => new Set(prev).add(p.id));
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">{selectedProductIds.size}</span> of{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{masterProducts.length}</span> catalog items selected for{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">{branch.name}</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAssignSubmit}
                  disabled={isSubmitting || selectedProductIds.size === 0}
                  className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    "Assigning..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Assign {selectedProductIds.size} Product{selectedProductIds.size === 1 ? "" : "s"} to Branch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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

      {/* 9. Remove Product from Branch Confirmation Modal */}
      {productToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Remove Product from Branch?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This item will no longer be sold at this branch</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              {productToRemove.image_url ? (
                <img src={productToRemove.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm">🍲</div>
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{productToRemove.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{productToRemove.category} • Branch: {branch.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Removing this product takes it off <strong>{branch.name}</strong>'s Sunmi POS terminal menu. You can re-add it anytime from the Master Catalog.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (!onRemoveProduct) return;
                  setIsSubmitting(true);
                  try {
                    await onRemoveProduct(branch.id, productToRemove.product_id);
                    triggerNotice(`Removed ${productToRemove.name} from ${branch.name}`);
                    setProductToRemove(null);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
