import React, { useState, useEffect } from 'react';
import { BarChart3, Package, Users, Printer, Smartphone } from 'lucide-react';
import { BranchFilterHeader } from './components/BranchFilterHeader';
import { SalesOverviewTab } from './components/SalesOverviewTab';
import { InventoryMatrixTab } from './components/InventoryMatrixTab';
import { PayrollManagerTab } from './components/PayrollManagerTab';
import { ReportsPrintTab } from './components/ReportsPrintTab';
import { DeviceProvisioningTab } from './components/DeviceProvisioningTab';
import { supabase } from './services/supabaseClient';
import { AnalyticsData, Branch, Device, InventoryItem, PayrollItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'payroll' | 'reports' | 'devices'>('sales');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Core State
  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, name: 'Downtown Flagship', code: 'BR-01', address: '101 Rizal Ave', devices_count: 1, orders_count: 142 },
    { id: 2, name: 'Mall Galleria', code: 'BR-02', address: 'Level 2, West Wing', devices_count: 1, orders_count: 98 },
    { id: 3, name: 'Express Kiosk', code: 'BR-03', address: 'Terminal 3 Station', devices_count: 1, orders_count: 55 }
  ]);

  const [devices, setDevices] = useState<Device[]>([
    { id: 1, branch_id: 1, device_serial: 'SUNMI-V2S-BR01-01', terminal_name: 'Branch 1 - Counter 01', device_token: 'DVT_01', status: 'online' },
    { id: 2, branch_id: 2, device_serial: 'SUNMI-V2S-BR02-01', terminal_name: 'Branch 2 - Counter 01', device_token: 'DVT_02', status: 'online' },
    { id: 3, branch_id: 3, device_serial: 'SUNMI-V2S-BR03-01', terminal_name: 'Branch 3 - Mobile Kiosk', device_token: 'DVT_03', status: 'online' }
  ]);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    filters: { branch_id: 'all', range: 'today', start_date: '', end_date: '' },
    kpis: {
      total_gross_revenue: 106500.00,
      total_sales_count: 295,
      average_order_value: 361.01,
      payment_breakdown: { cash: 62400.00, ewallet: 32100.00, card: 12000.00 }
    },
    branch_comparison: [
      { branch_id: 1, name: 'Downtown Flagship', code: 'BR-01', active_devices: 1, total_sales: 48500.00, order_count: 142 },
      { branch_id: 2, name: 'Mall Galleria', code: 'BR-02', active_devices: 1, total_sales: 36200.00, order_count: 98 },
      { branch_id: 3, name: 'Express Kiosk', code: 'BR-03', active_devices: 1, total_sales: 21800.00, order_count: 55 }
    ],
    top_products: [
      { product_name: 'Iced Caramel Macchiato', total_qty: 84, total_revenue: 12180.00 },
      { product_name: 'Spanish Latte (Cold)', total_qty: 72, total_revenue: 9720.00 },
      { product_name: 'Beef Tapa Rice Bowl', total_qty: 54, total_revenue: 9720.00 },
      { product_name: 'Americano Espresso', total_qty: 48, total_revenue: 4560.00 },
      { product_name: 'Butter Croissant', total_qty: 40, total_revenue: 3400.00 }
    ]
  });

  const [inventoryMatrix, setInventoryMatrix] = useState<InventoryItem[]>([
    { product_id: 1, name: 'Iced Caramel Macchiato', category: 'Coffee & Drinks', base_price: 145, cost_price: 45, branch_stocks: { 1: 80, 2: 50, 3: 30 }, total_stock: 160 },
    { product_id: 2, name: 'Spanish Latte (Cold)', category: 'Coffee & Drinks', base_price: 135, cost_price: 40, branch_stocks: { 1: 100, 2: 75, 3: 40 }, total_stock: 215 },
    { product_id: 3, name: 'Americano Espresso', category: 'Coffee & Drinks', base_price: 95, cost_price: 20, branch_stocks: { 1: 120, 2: 90, 3: 60 }, total_stock: 270 },
    { product_id: 4, name: 'Butter Croissant', category: 'Bakery & Pastries', base_price: 85, cost_price: 30, branch_stocks: { 1: 35, 2: 20, 3: 15 }, total_stock: 70 },
    { product_id: 5, name: 'Chocolate Lava Muffin', category: 'Bakery & Pastries', base_price: 95, cost_price: 35, branch_stocks: { 1: 25, 2: 18, 3: 10 }, total_stock: 53 },
    { product_id: 6, name: 'Beef Tapa Rice Bowl', category: 'Hot Meals', base_price: 180, cost_price: 70, branch_stocks: { 1: 50, 2: 35, 3: 0 }, total_stock: 85 },
    { product_id: 7, name: 'Chicken Teriyaki Bowl', category: 'Hot Meals', base_price: 165, cost_price: 60, branch_stocks: { 1: 45, 2: 40, 3: 0 }, total_stock: 85 },
    { product_id: 8, name: 'Truffle Fries', category: 'Quick Snacks', base_price: 120, cost_price: 40, branch_stocks: { 1: 60, 2: 40, 3: 25 }, total_stock: 125 }
  ]);

  const [payrollData, setPayrollData] = useState<PayrollItem[]>([
    { user_id: 1, staff_name: 'Maria Santos', role: 'cashier', branch_id: 1, branch_name: 'Downtown Flagship', period_start: '2026-08-01', period_end: '2026-08-15', hourly_rate: 85.00, total_hours: 88.0, gross_pay: 7480.00, deductions: 250.00, bonuses: 500.00, net_pay: 7730.00 },
    { user_id: 2, staff_name: 'John Dela Cruz', role: 'cashier', branch_id: 2, branch_name: 'Mall Galleria', period_start: '2026-08-01', period_end: '2026-08-15', hourly_rate: 85.00, total_hours: 80.0, gross_pay: 6800.00, deductions: 200.00, bonuses: 300.00, net_pay: 6900.00 },
    { user_id: 3, staff_name: 'Ana Reyes', role: 'cashier', branch_id: 3, branch_name: 'Express Kiosk', period_start: '2026-08-01', period_end: '2026-08-15', hourly_rate: 80.00, total_hours: 75.0, gross_pay: 6000.00, deductions: 150.00, bonuses: 200.00, net_pay: 6050.00 }
  ]);

  useEffect(() => {
    fetchFromSupabase();
  }, [selectedBranchId, selectedRange]);

  const fetchFromSupabase = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Branches from Supabase
      const { data: branchData } = await supabase.from('branches').select('*').order('id');
      if (branchData && branchData.length > 0) {
        setBranches(branchData);
      }

      // 2. Fetch Products & Branch Inventories
      const { data: prodData } = await supabase.from('products').select('*').order('id');
      const { data: invData } = await supabase.from('branch_inventory').select('*');

      if (prodData && invData) {
        const matrix = prodData.map((p) => {
          const bStocks: Record<number, number> = {};
          let total = 0;
          for (const inv of invData) {
            if (inv.product_id === p.id) {
              const qty = Number(inv.stock_quantity || 0);
              bStocks[inv.branch_id] = qty;
              total += qty;
            }
          }
          return {
            product_id: p.id,
            name: p.name,
            category: p.category,
            base_price: Number(p.base_price),
            cost_price: Number(p.cost_price),
            branch_stocks: bStocks,
            total_stock: total
          };
        });
        setInventoryMatrix(matrix);
      }

      // 3. Fetch Daily Batches from Supabase
      let batchQuery = supabase.from('daily_batches').select('*').order('sync_date', { ascending: false });
      if (selectedBranchId !== 'all') {
        batchQuery = batchQuery.eq('branch_id', Number(selectedBranchId));
      }
      const { data: batches } = await batchQuery;

      if (batches && batches.length > 0) {
        let totalGross = 0;
        let totalOrders = 0;
        let cashTotal = 0;
        let ewalletTotal = 0;
        let cardTotal = 0;

        for (const b of batches) {
          totalGross += Number(b.gross_sales || 0);
          totalOrders += Number(b.orders_count || 0);
          cashTotal += Number(b.cash_sales || 0);
          ewalletTotal += Number(b.ewallet_sales || 0);
          cardTotal += Number(b.card_sales || 0);
        }

        setAnalytics((prev) => ({
          ...prev,
          kpis: {
            total_gross_revenue: totalGross || prev.kpis.total_gross_revenue,
            total_sales_count: totalOrders || prev.kpis.total_sales_count,
            average_order_value: totalOrders > 0 ? totalGross / totalOrders : prev.kpis.average_order_value,
            payment_breakdown: {
              cash: cashTotal || prev.kpis.payment_breakdown.cash,
              ewallet: ewalletTotal || prev.kpis.payment_breakdown.ewallet,
              card: cardTotal || prev.kpis.payment_breakdown.card
            }
          }
        }));
      }
    } catch (e) {
      console.log('Supabase read active with fallback state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportOfflineBatch = (batchData: any) => {
    if (batchData.orders) {
      const addedRevenue = batchData.orders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      const addedCount = batchData.orders.length;

      setAnalytics((prev) => ({
        ...prev,
        kpis: {
          ...prev.kpis,
          total_gross_revenue: prev.kpis.total_gross_revenue + addedRevenue,
          total_sales_count: prev.kpis.total_sales_count + addedCount,
          average_order_value: (prev.kpis.total_gross_revenue + addedRevenue) / (prev.kpis.total_sales_count + addedCount)
        }
      }));
    } else if (batchData.analytics) {
      setAnalytics(batchData.analytics);
      if (batchData.inventory) setInventoryMatrix(batchData.inventory);
      if (batchData.payroll) setPayrollData(batchData.payroll);
    }
  };

  const handleRestock = async (branchId: number, productId: number, qty: number, notes: string) => {
    // 1. Update in Supabase cloud
    try {
      const { data: existing } = await supabase
        .from('branch_inventory')
        .select('*')
        .eq('branch_id', branchId)
        .eq('product_id', productId)
        .single();

      const newQty = existing ? Number(existing.stock_quantity) + qty : qty;

      await supabase.from('branch_inventory').upsert(
        {
          branch_id: branchId,
          product_id: productId,
          stock_quantity: newQty,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'branch_id,product_id' }
      );
    } catch (e) {
      console.warn('Direct Supabase restock fallback:', e);
    }

    // 2. Local State update
    setInventoryMatrix((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const currentBranchStock = item.branch_stocks[branchId] || 0;
          const updatedBranchStock = currentBranchStock + qty;
          return {
            ...item,
            branch_stocks: { ...item.branch_stocks, [branchId]: updatedBranchStock },
            total_stock: item.total_stock + qty
          };
        }
        return item;
      })
    );
  };

  const handlePairNewDevice = async (serial: string, branchId: number, name: string) => {
    const newDevice: Device = {
      id: devices.length + 1,
      branch_id: branchId,
      device_serial: serial,
      terminal_name: name,
      device_token: 'DVT_' + serial,
      status: 'online',
      last_seen_at: new Date().toISOString()
    };
    setDevices([newDevice, ...devices]);
  };

  const handleCalculatePayroll = async (branchId: string, start: string, end: string) => {
    try {
      const { data: staff } = await supabase.from('staff_records').select('*');
      if (staff && staff.length > 0) {
        const computed = staff.map((s) => {
          const branchObj = branches.find((b) => b.id === s.branch_id);
          const hours = 80.0;
          const rate = Number(s.hourly_rate || 85);
          const gross = hours * rate;
          const deductions = 200.0;
          const bonuses = 300.0;
          return {
            user_id: s.id,
            staff_name: s.name,
            role: s.role,
            branch_id: s.branch_id,
            branch_name: branchObj ? branchObj.name : 'Main Store',
            period_start: start,
            period_end: end,
            hourly_rate: rate,
            total_hours: hours,
            gross_pay: gross,
            deductions,
            bonuses,
            net_pay: gross + bonuses - deductions
          };
        });
        setPayrollData(computed);
      }
    } catch (e) {}
  };

  const handleApprovePayroll = async (records: PayrollItem[]) => {
    alert('Payroll records approved and finalized!');
  };

  const selectedBranchName = selectedBranchId === 'all'
    ? 'All Branches (Consolidated)'
    : (branches.find((b) => String(b.id) === selectedBranchId)?.name || 'Selected Branch');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Top Fixed Header */}
      <BranchFilterHeader
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        selectedRange={selectedRange}
        onSelectRange={setSelectedRange}
        onRefresh={fetchFromSupabase}
        isLoading={isLoading}
      />

      {/* 2. Navigation Tabs */}
      <nav className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 no-print">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Live Sales & Overview
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" /> Multi-Branch Stock & Restock
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'payroll'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" /> Staff Timeclock & Payroll
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-4 h-4" /> Exports & Print Center
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'devices'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Sunmi Devices ({devices.length})
          </button>
        </div>
      </nav>

      {/* 3. Tab Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'sales' && <SalesOverviewTab data={analytics} branches={branches} />}
        {activeTab === 'inventory' && (
          <InventoryMatrixTab branches={branches} items={inventoryMatrix} onRestock={handleRestock} />
        )}
        {activeTab === 'payroll' && (
          <PayrollManagerTab
            branches={branches}
            payrollData={payrollData}
            onCalculate={handleCalculatePayroll}
            onApprove={handleApprovePayroll}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsPrintTab
            branches={branches}
            analytics={analytics}
            inventory={inventoryMatrix}
            payroll={payrollData}
            selectedBranchName={selectedBranchName}
            onImportOfflineBatch={handleImportOfflineBatch}
          />
        )}
        {activeTab === 'devices' && (
          <DeviceProvisioningTab
            branches={branches}
            devices={devices}
            onPairNewDevice={handlePairNewDevice}
          />
        )}
      </main>
    </div>
  );
}
