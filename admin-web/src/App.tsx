import React, { useState, useEffect } from "react";
import { SidebarMenuBar, TabKey } from "./components/SidebarMenuBar";
import { BranchFilterHeader } from "./components/BranchFilterHeader";
import { BranchSetupManager } from "./components/BranchSetupManager";
import { InventoryMatrixTab } from "./components/InventoryMatrixTab";
import { SalesOverviewTab } from "./components/SalesOverviewTab";
import { PayrollManagerTab } from "./components/PayrollManagerTab";
import { ReportsPrintTab } from "./components/ReportsPrintTab";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { supabase } from "./services/supabaseClient";
import { AnalyticsData, Branch, InventoryItem, PayrollItem, Product, StaffRecord } from "./types";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(() => {
    const saved = localStorage.getItem("kv_pos_admin_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<TabKey>("branches");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedRange, setSelectedRange] = useState<string>("today");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 100% Real Live State from Supabase
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventoryMatrix, setInventoryMatrix] = useState<InventoryItem[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [rawBatches, setRawBatches] = useState<any[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Deep Branch View Drilldown & Z-Report modal state
  const [selectedBranchDetail, setSelectedBranchDetail] = useState<Branch | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState<boolean>(false);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    filters: { branch_id: "all", range: "today", start_date: "", end_date: "" },
    kpis: {
      total_gross_revenue: 0,
      total_sales_count: 0,
      average_order_value: 0,
      payment_breakdown: { cash: 0, ewallet: 0, card: 0 }
    },
    branch_comparison: [],
    top_products: []
  });

  const handleLoginSuccess = (user: { email: string; role: string }) => {
    setCurrentUser(user);
    localStorage.setItem("kv_pos_admin_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("kv_pos_admin_user");
  };

  useEffect(() => {
    if (currentUser) {
      fetchLiveSupabaseData();
    }
  }, [currentUser, selectedBranchId, selectedRange]);

  const fetchLiveSupabaseData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Branches
      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .order("id");

      const liveBranches: Branch[] = branchData || [];
      setBranches(liveBranches);

      // Keep selected branch detail reference in sync with latest data
      if (selectedBranchDetail) {
        const updated = liveBranches.find((b) => b.id === selectedBranchDetail.id);
        if (updated) setSelectedBranchDetail(updated);
      }

      // 2. Fetch Master Products & Branch Inventories
      const { data: prodData } = await supabase.from("products").select("*").order("id");
      const { data: invData } = await supabase.from("branch_inventory").select("*");

      if (prodData) {
        const matrix: InventoryItem[] = prodData.map((p) => {
          const bStocks: Record<number, number> = {};
          let total = 0;
          if (invData) {
            for (const inv of invData) {
              if (inv.product_id === p.id) {
                const qty = Number(inv.stock_quantity || 0);
                bStocks[inv.branch_id] = qty;
                total += qty;
              }
            }
          }
          return {
            product_id: p.id,
            name: p.name,
            category: p.category,
            image_url: p.image_url,
            base_price: Number(p.base_price),
            cost_price: Number(p.cost_price),
            branch_stocks: bStocks,
            total_stock: total
          };
        });
        setInventoryMatrix(matrix);
      }

      // 3. Fetch Staff Records
      const { data: staffData } = await supabase.from("staff_records").select("*").order("id");
      setStaffRecords(staffData || []);

      // 4. Fetch Real Daily Batches
      let batchQuery = supabase.from("daily_batches").select("*").order("sync_date", { ascending: false });
      if (selectedBranchId !== "all") {
        batchQuery = batchQuery.eq("branch_id", Number(selectedBranchId));
      }
      const { data: batches } = await batchQuery;
      setRawBatches(batches || []);

      if (batches && batches.length > 0) {
        let totalGross = 0;
        let totalOrders = 0;
        let cashTotal = 0;
        let ewalletTotal = 0;
        let cardTotal = 0;
        const branchMap: Record<number, { count: number; sales: number }> = {};
        const productMap: Record<string, { qty: number; revenue: number }> = {};

        for (const b of batches) {
          const gross = Number(b.gross_sales || 0);
          const count = Number(b.orders_count || 0);
          totalGross += gross;
          totalOrders += count;
          cashTotal += Number(b.cash_sales || 0);
          ewalletTotal += Number(b.ewallet_sales || 0);
          cardTotal += Number(b.card_sales || 0);

          if (!branchMap[b.branch_id]) {
            branchMap[b.branch_id] = { count: 0, sales: 0 };
          }
          branchMap[b.branch_id].count += count;
          branchMap[b.branch_id].sales += gross;

          if (Array.isArray(b.orders_payload)) {
            for (const ord of b.orders_payload) {
              if (Array.isArray(ord.items)) {
                for (const it of ord.items) {
                  const pName = it.name || "Custom Item";
                  if (!productMap[pName]) productMap[pName] = { qty: 0, revenue: 0 };
                  productMap[pName].qty += Number(it.qty || 1);
                  productMap[pName].revenue += Number(it.total_price || (it.qty * it.unit_price) || 0);
                }
              }
            }
          }
        }

        const topProds = Object.entries(productMap)
          .map(([name, stat]) => ({ product_name: name, total_qty: stat.qty, total_revenue: stat.revenue }))
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 5);

        const comparison = liveBranches.map((br) => ({
          branch_id: br.id,
          name: br.name,
          code: br.code,
          import_code: br.import_code,
          active_devices: 1,
          total_sales: branchMap[br.id]?.sales || 0,
          order_count: branchMap[br.id]?.count || 0
        }));

        setAnalytics({
          filters: { branch_id: selectedBranchId, range: selectedRange, start_date: "", end_date: "" },
          kpis: {
            total_gross_revenue: totalGross,
            total_sales_count: totalOrders,
            average_order_value: totalOrders > 0 ? totalGross / totalOrders : 0,
            payment_breakdown: { cash: cashTotal, ewallet: ewalletTotal, card: cardTotal }
          },
          branch_comparison: comparison,
          top_products: topProds
        });
      } else {
        const comparison = liveBranches.map((br) => ({
          branch_id: br.id,
          name: br.name,
          code: br.code,
          import_code: br.import_code,
          active_devices: 1,
          total_sales: 0,
          order_count: 0
        }));

        setAnalytics({
          filters: { branch_id: selectedBranchId, range: selectedRange, start_date: "", end_date: "" },
          kpis: {
            total_gross_revenue: 0,
            total_sales_count: 0,
            average_order_value: 0,
            payment_breakdown: { cash: 0, ewallet: 0, card: 0 }
          },
          branch_comparison: comparison,
          top_products: []
        });
      }
    } catch (e) {
      console.warn("Supabase fetch:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Branch Save / Create
  const handleSaveBranch = async (branchData: Partial<Branch>) => {
    try {
      const { error } = await supabase.from("branches").upsert(branchData);
      if (error) throw error;
      await fetchLiveSupabaseData();
    } catch (e: any) {
      alert("Failed to save branch: " + e.message);
    }
  };

  // Master Product Save / Create
  const handleSaveProduct = async (data: { product: Partial<Product>; branchStocks: Record<number, number> }) => {
    try {
      const { data: savedProd, error: prodErr } = await supabase
        .from("products")
        .upsert({
          id: data.product.id,
          name: data.product.name,
          category: data.product.category,
          image_url: data.product.image_url,
          base_price: data.product.base_price,
          cost_price: data.product.cost_price,
          is_active: true
        })
        .select()
        .single();

      if (prodErr) throw prodErr;

      // Upsert stock per branch
      for (const [branchId, stockQty] of Object.entries(data.branchStocks)) {
        await supabase.from("branch_inventory").upsert(
          {
            branch_id: Number(branchId),
            product_id: savedProd.id,
            stock_quantity: Number(stockQty || 0),
            updated_at: new Date().toISOString()
          },
          { onConflict: "branch_id,product_id" }
        );
      }

      await fetchLiveSupabaseData();
      alert("Product saved and stock allocated successfully in Supabase!");
    } catch (e: any) {
      alert("Failed to save product: " + e.message);
    }
  };

  // Assign product from master catalog directly into a specific branch
  const handleAssignProductToBranch = async (branchId: number, productId: number, stockQty: number) => {
    try {
      await supabase.from("branch_inventory").upsert(
        {
          branch_id: branchId,
          product_id: productId,
          stock_quantity: stockQty,
          updated_at: new Date().toISOString()
        },
        { onConflict: "branch_id,product_id" }
      );

      await fetchLiveSupabaseData();
      alert("Product successfully assigned to branch with stock!");
    } catch (e: any) {
      alert("Assignment failed: " + e.message);
    }
  };

  // Restock action
  const handleRestock = async (branchId: number, productId: number, qty: number, notes: string) => {
    try {
      const { data: existing } = await supabase
        .from("branch_inventory")
        .select("*")
        .eq("branch_id", branchId)
        .eq("product_id", productId)
        .single();

      const newQty = existing ? Number(existing.stock_quantity) + qty : qty;

      await supabase.from("branch_inventory").upsert(
        {
          branch_id: branchId,
          product_id: productId,
          stock_quantity: newQty,
          updated_at: new Date().toISOString()
        },
        { onConflict: "branch_id,product_id" }
      );

      await fetchLiveSupabaseData();
    } catch (e: any) {
      alert("Restock failed: " + e.message);
    }
  };

  if (!currentUser) {
    return <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const tabTitles: Record<TabKey, string> = {
    branches: "🏢 Store Branches Hub",
    inventory: "📦 Centralized Master Product Catalog & Stocks",
    sales: "📊 Real-Time Multi-Branch Sales & Revenue Overview",
    payroll: "👥 Staff Timeclocks & Hourly Payroll Manager",
    reports: "📥 Client Data Retrieval, 1-Click Exports & Prints"
  };

  const selectedBranchName = selectedBranchId === "all"
    ? "All Branches (Consolidated)"
    : (branches.find((b) => String(b.id) === selectedBranchId)?.name || "Selected Branch");

  // Master products list for branch assignment dropdowns
  const masterProducts: Product[] = inventoryMatrix.map((i) => ({
    id: i.product_id,
    name: i.name,
    category: i.category,
    base_price: i.base_price,
    cost_price: i.cost_price,
    image_url: i.image_url,
    is_active: true
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* 1. Sleek Left Menu Bar */}
      <SidebarMenuBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "branches") setSelectedBranchDetail(null);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimalist Header */}
        <BranchFilterHeader
          branches={branches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
          selectedRange={selectedRange}
          onSelectRange={setSelectedRange}
          onRefresh={fetchLiveSupabaseData}
          isLoading={isLoading}
          pageTitle={tabTitles[activeTab]}
          activeTab={activeTab}
          activeBranchDetail={activeTab === "branches" ? selectedBranchDetail : null}
          onBackFromBranch={() => setSelectedBranchDetail(null)}
          onOpenZReport={() => setIsZReportOpen(true)}
        />

        {/* Dynamic Container Feature View */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === "branches" && (
            <BranchSetupManager
              branches={branches}
              onSaveBranch={handleSaveBranch}
              masterProducts={masterProducts}
              branchInventory={inventoryMatrix}
              analytics={analytics}
              onAssignProduct={handleAssignProductToBranch}
              onRestock={handleRestock}
              batches={rawBatches}
              staffList={staffRecords}
              onRefreshStaff={fetchLiveSupabaseData}
              selectedBranch={selectedBranchDetail}
              onSelectBranch={setSelectedBranchDetail}
              isZReportOpen={isZReportOpen}
              onCloseZReport={() => setIsZReportOpen(false)}
            />
          )}
          {activeTab === "inventory" && (
            <InventoryMatrixTab
              branches={branches}
              items={inventoryMatrix}
              onRestock={handleRestock}
              onSaveProduct={handleSaveProduct}
            />
          )}
          {activeTab === "sales" && (
            <SalesOverviewTab data={analytics} branches={branches} />
          )}
          {activeTab === "payroll" && (
            <PayrollManagerTab
              branches={branches}
              payrollData={payrollData}
              onCalculate={async () => {}}
              onApprove={async () => {}}
            />
          )}
          {activeTab === "reports" && (
            <ReportsPrintTab
              branches={branches}
              analytics={analytics}
              inventory={inventoryMatrix}
              payroll={payrollData}
              selectedBranchName={selectedBranchName}
              onImportOfflineBatch={() => fetchLiveSupabaseData()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
