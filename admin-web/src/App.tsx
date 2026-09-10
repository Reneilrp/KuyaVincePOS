import React, { useState, useEffect } from "react";
import { SidebarMenuBar, TabKey } from "./components/SidebarMenuBar";
import { BranchFilterHeader } from "./components/BranchFilterHeader";
import { BranchSetupManager } from "./components/BranchSetupManager";
import { InventoryMatrixTab } from "./components/InventoryMatrixTab";
import { SalesOverviewTab } from "./components/SalesOverviewTab";
import { PayrollManagerTab } from "./components/PayrollManagerTab";
import { ReportsPrintTab } from "./components/ReportsPrintTab";
import { SettingsTab } from "./components/SettingsTab";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { supabase } from "./services/supabaseClient";
import { AnalyticsData, Branch, InventoryItem, PayrollItem, Product, StaffRecord, AppNotification } from "./types";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;    // 30 minutes

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; loginAt?: number } | null>(() => {
    try {
      const saved = localStorage.getItem('kv_pos_admin_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed.loginAt || Date.now() - parsed.loginAt > SESSION_TTL_MS) {
        localStorage.removeItem('kv_pos_admin_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
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

  // Notifications & Activity Timeline State
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("kv_pos_read_notifications");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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
    const userWithSession = { ...user, loginAt: Date.now() };
    setCurrentUser(userWithSession);
    localStorage.setItem('kv_pos_admin_user', JSON.stringify(userWithSession));
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

  // Idle session timeout — clear session after 30 min of no user interaction
  useEffect(() => {
    if (!currentUser) return;
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        localStorage.removeItem('kv_pos_admin_user');
        setCurrentUser(null);
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [currentUser]);

  // Realtime Supabase subscription for incoming branch uploads
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel("public-daily-batches-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "daily_batches" },
        (payload) => {
          console.log("⚡ Realtime Batch Sync Received from Branch:", payload);
          fetchLiveSupabaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Derive notifications from rawBatches, inventoryMatrix, and staffRecords
  const updateNotificationsFromData = (
    currentBatches: any[],
    matrix: InventoryItem[],
    currentBranches: Branch[],
    readIds: Set<string>
  ) => {
    const list: AppNotification[] = [];

    // 1. Batch Uploads Activity
    if (Array.isArray(currentBatches)) {
      currentBatches.forEach((b) => {
        const br = currentBranches.find((x) => x.id === b.branch_id);
        const branchName = br ? br.name : `Branch #${b.branch_id}`;
        const notifId = `batch-${b.batch_id || b.id}`;
        const gross = Number(b.gross_sales || 0);
        const count = Number(b.orders_count || 0);

        list.push({
          id: notifId,
          type: "batch_sync",
          title: count > 0 ? `${count} Orders Uploaded (₱${gross.toFixed(2)})` : `Daily Batch Upload Received`,
          message: `Branch "${branchName}" uploaded end-of-day sales data with ${count} completed orders.`,
          timestamp: b.received_at || b.created_at || (b.sync_date ? `${b.sync_date}T12:00:00.000Z` : new Date().toISOString()),
          branch_id: b.branch_id,
          branch_name: branchName,
          read: readIds.has(notifId),
          meta: {
            batch_id: b.batch_id,
            gross_sales: gross,
            orders_count: count
          }
        });
      });
    }

    // 2. Low Stock Alerts (threshold <= 5 units)
    if (Array.isArray(matrix) && Array.isArray(currentBranches)) {
      matrix.forEach((item) => {
        currentBranches.forEach((br) => {
          if (br.is_active !== false) {
            const stock = item.branch_stocks[br.id];
            if (stock !== undefined && stock <= 5 && !item.excluded_branch_ids?.includes(br.id)) {
              const notifId = `stock-${item.product_id}-${br.id}`;
              list.push({
                id: notifId,
                type: "low_stock",
                title: `Low Stock: ${item.name}`,
                message: `${item.name} has only ${stock} units remaining at ${br.name}. Restock recommended.`,
                timestamp: new Date().toISOString(),
                branch_id: br.id,
                branch_name: br.name,
                read: readIds.has(notifId),
                meta: {
                  product_name: item.name,
                  current_stock: stock
                }
              });
            }
          }
        });
      });
    }

    // Sort newest timestamp first
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setNotifications(list);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("kv_pos_read_notifications", JSON.stringify(Array.from(next)));
      return next;
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const next = new Set([...Array.from(readNotificationIds), ...allIds]);
    setReadNotificationIds(next);
    localStorage.setItem("kv_pos_read_notifications", JSON.stringify(Array.from(next)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    const next = new Set([...Array.from(readNotificationIds), ...allIds]);
    setReadNotificationIds(next);
    localStorage.setItem("kv_pos_read_notifications", JSON.stringify(Array.from(next)));
    setNotifications([]);
  };

  const handleNotificationAction = (notification: AppNotification) => {
    handleMarkNotificationAsRead(notification.id);
    if (notification.type === "batch_sync" && notification.branch_id) {
      const targetBranch = branches.find((b) => b.id === notification.branch_id);
      if (targetBranch) {
        setSelectedBranchDetail(targetBranch);
        setActiveTab("branches");
      }
    } else if (notification.type === "low_stock") {
      setActiveTab("inventory");
    } else if (notification.type === "staff_shift") {
      setActiveTab("payroll");
    }
  };

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
      let loadedMatrix: InventoryItem[] = [];

      if (prodData) {
        loadedMatrix = prodData.map((p) => {
          const bStocks: Record<number, number> = {};
          const bPrices: Record<number, number | null> = {};
          const excludedBranchIds: number[] = [];
          let total = 0;
          if (invData) {
            for (const inv of invData) {
              if (inv.product_id === p.id) {
                const qty = Number(inv.stock_quantity || 0);
                bStocks[inv.branch_id] = qty;
                if (inv.price_override !== null && inv.price_override !== undefined) {
                  bPrices[inv.branch_id] = Number(inv.price_override);
                }
                if (inv.is_active === false) {
                  excludedBranchIds.push(inv.branch_id);
                } else {
                  total += qty;
                }
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
            branch_prices: bPrices,
            excluded_branch_ids: excludedBranchIds,
            total_stock: total
          };
        });
        setInventoryMatrix(loadedMatrix);
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
        let totalGrossCents = 0;
        let totalOrders = 0;
        let cashTotalCents = 0;
        let ewalletTotalCents = 0;
        let cardTotalCents = 0;
        const branchMap: Record<number, { count: number; salesCents: number }> = {};
        const productMap: Record<string, { qty: number; revenueCents: number }> = {};

        for (const b of batches) {
          const grossCents = Math.round(Number(b.gross_sales || 0) * 100);
          const count = Number(b.orders_count || 0);
          totalGrossCents += grossCents;
          totalOrders += count;
          cashTotalCents += Math.round(Number(b.cash_sales || 0) * 100);
          ewalletTotalCents += Math.round(Number(b.ewallet_sales || 0) * 100);
          cardTotalCents += Math.round(Number(b.card_sales || 0) * 100);

          if (!branchMap[b.branch_id]) {
            branchMap[b.branch_id] = { count: 0, salesCents: 0 };
          }
          branchMap[b.branch_id].count += count;
          branchMap[b.branch_id].salesCents += grossCents;

          if (Array.isArray(b.orders_payload)) {
            for (const ord of b.orders_payload) {
              if (Array.isArray(ord.items)) {
                for (const it of ord.items) {
                  const pName = it.name || "Custom Item";
                  if (!productMap[pName]) productMap[pName] = { qty: 0, revenueCents: 0 };
                  const itemRevenueCents = Math.round(Number(it.total_price || (it.qty * it.unit_price) || 0) * 100);
                  productMap[pName].qty += Number(it.qty || 1);
                  productMap[pName].revenueCents += itemRevenueCents;
                }
              }
            }
          }
        }

        const topProds = Object.entries(productMap)
          .map(([name, stat]) => ({ product_name: name, total_qty: stat.qty, total_revenue: stat.revenueCents / 100 }))
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 5);

        const activeBranches = liveBranches.filter((br) => br.is_active !== false);
        const comparison = activeBranches.map((br) => ({
          branch_id: br.id,
          name: br.name,
          code: br.code,
          import_code: br.import_code,
          active_devices: 1,
          total_sales: (branchMap[br.id]?.salesCents || 0) / 100,
          order_count: branchMap[br.id]?.count || 0
        }));

        const totalGross = totalGrossCents / 100;
        const avgOrderValue = totalOrders > 0 ? Math.round((totalGross / totalOrders) * 100) / 100 : 0;

        setAnalytics({
          filters: { branch_id: selectedBranchId, range: selectedRange, start_date: "", end_date: "" },
          kpis: {
            total_gross_revenue: totalGross,
            total_sales_count: totalOrders,
            average_order_value: avgOrderValue,
            payment_breakdown: { cash: cashTotalCents / 100, ewallet: ewalletTotalCents / 100, card: cardTotalCents / 100 }
          },
          branch_comparison: comparison,
          top_products: topProds
        });
      } else {
        const activeBranches = liveBranches.filter((br) => br.is_active !== false);
        const comparison = activeBranches.map((br) => ({
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

      // Update Notifications Activity Timeline Feed
      updateNotificationsFromData(batches || [], loadedMatrix, liveBranches, readNotificationIds);
    } catch (e) {
      console.warn("Supabase fetch:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Branch Save / Create with Safe ID allocation
  const handleSaveBranch = async (branchData: Partial<Branch>) => {
    try {
      const branchId = branchData.id || (Math.max(...branches.map((b) => Number(b.id)), 0) + 1);
      const payload = { 
        ...branchData, 
        id: branchId,
        is_active: branchData.is_active !== undefined ? branchData.is_active : true 
      };
      const { error } = await supabase.from("branches").upsert(payload);
      if (error) throw error;
      await fetchLiveSupabaseData();
    } catch (e: any) {
      alert("Failed to save branch: " + e.message);
    }
  };

  // Master Product Save / Create
  const handleSaveProduct = async (data: { product: Partial<Product>; branchStocks?: Record<number, number | null> }) => {
    try {
      const { data: savedProd, error: prodErr } = await supabase
        .from("products")
        .upsert({
          id: data.product.id,
          name: data.product.name,
          category: data.product.category,
          image_url: data.product.image_url,
          base_price: data.product.base_price,
          cost_price: data.product.cost_price || 0,
          is_active: true
        })
        .select()
        .single();

      if (prodErr) throw prodErr;

      // Upsert or delete stock per branch (if branchStocks provided)
      if (data.branchStocks && Object.keys(data.branchStocks).length > 0) {
        for (const [branchId, stockQty] of Object.entries(data.branchStocks)) {
          if (stockQty === null || stockQty === undefined) {
            // Excluded — mark row as inactive (preserves last known stock count)
            await supabase.from("branch_inventory").upsert(
              {
                branch_id: Number(branchId),
                product_id: savedProd.id,
                is_active: false,
                updated_at: new Date().toISOString()
              },
              { onConflict: "branch_id,product_id" }
            );
          } else {
            // Included — upsert stock quantity and mark active
            await supabase.from("branch_inventory").upsert(
              {
                branch_id: Number(branchId),
                product_id: savedProd.id,
                stock_quantity: Number(stockQty || 0),
                is_active: true,
                updated_at: new Date().toISOString()
              },
              { onConflict: "branch_id,product_id" }
            );
          }
        }
      }

      await fetchLiveSupabaseData();
      alert("Product saved successfully!");
    } catch (e: any) {
      alert("Failed to save product: " + e.message);
    }
  };

  // Assign product(s) from master catalog directly into a specific branch
  const handleAssignProductToBranch = async (
    branchId: number,
    assignments: Array<{ productId: number; stockQty: number; priceOverride?: number | null }> | number,
    stockQty?: number,
    priceOverride?: number | null
  ) => {
    try {
      const itemsToUpsert = Array.isArray(assignments)
        ? assignments
        : [{ productId: assignments, stockQty: stockQty ?? 50, priceOverride: priceOverride ?? null }];

      const payload = itemsToUpsert.map((it) => ({
        branch_id: branchId,
        product_id: it.productId,
        stock_quantity: Number(it.stockQty || 0),
        price_override: it.priceOverride !== undefined ? it.priceOverride : null,
        is_active: true,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from("branch_inventory").upsert(payload, {
        onConflict: "branch_id,product_id"
      });

      if (error) throw error;

      await fetchLiveSupabaseData();
      alert(`Successfully assigned ${itemsToUpsert.length} product(s) to branch!`);
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
    inventory: "📦 Master Product",
    sales: "📊 Centralized Sales",
    payroll: "👥 Staff & Payroll",
    reports: "📥 Exports & Reports",
    settings: "⚙️ Profile & Settings"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex transition-colors">
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
          activeBranchDetail={activeTab === 'branches' ? selectedBranchDetail : null}
          onOpenZReport={() => setIsZReportOpen(true)}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onNotificationAction={handleNotificationAction}
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
            <SalesOverviewTab data={analytics} branches={branches} lastSyncAt={rawBatches[0]?.received_at ?? null} />
          )}
          {activeTab === "payroll" && (
            <PayrollManagerTab
              branches={branches}
              payrollData={payrollData}
              staffList={staffRecords}
              onRefreshStaff={fetchLiveSupabaseData}
              onCalculate={async () => {}}
              onApprove={async () => {}}
              currentUser={currentUser}
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
          {activeTab === "settings" && (
            <SettingsTab
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
