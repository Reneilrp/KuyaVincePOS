import React, { useState, useEffect } from 'react';
import { BarChart3, Package, Users, Printer, Building2 } from 'lucide-react';
import { BranchFilterHeader } from './components/BranchFilterHeader';
import { SalesOverviewTab } from './components/SalesOverviewTab';
import { InventoryMatrixTab } from './components/InventoryMatrixTab';
import { BranchSetupManager } from './components/BranchSetupManager';
import { PayrollManagerTab } from './components/PayrollManagerTab';
import { ReportsPrintTab } from './components/ReportsPrintTab';
import { supabase } from './services/supabaseClient';
import { AnalyticsData, Branch, InventoryItem, PayrollItem, Product } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'branches' | 'payroll' | 'reports'>('branches');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Clean Production State (Zero Demo Junk)
  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, name: 'Branch 1 - Main Hub', code: 'BR-01', import_code: 'KV-BR01', address: 'Zamboanga City', phone: '+63 917 000 0001' },
    { id: 2, name: 'Branch 2 - Mall Outlet', code: 'BR-02', import_code: 'KV-BR02', address: 'Zamboanga City', phone: '+63 917 000 0002' },
    { id: 3, name: 'Branch 3 - Kiosk', code: 'BR-03', import_code: 'KV-BR03', address: 'Zamboanga City', phone: '+63 917 000 0003' }
  ]);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    filters: { branch_id: 'all', range: 'today', start_date: '', end_date: '' },
    kpis: {
      total_gross_revenue: 0.00,
      total_sales_count: 0,
      average_order_value: 0.00,
      payment_breakdown: { cash: 0.00, ewallet: 0.00, card: 0.00 }
    },
    branch_comparison: [],
    top_products: []
  });

  const [inventoryMatrix, setInventoryMatrix] = useState<InventoryItem[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);

  useEffect(() => {
    fetchFromSupabase();
  }, [selectedBranchId, selectedRange]);

  const fetchFromSupabase = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Branches
      const { data: branchData } = await supabase.from('branches').select('*').order('id');
      if (branchData && branchData.length > 0) {
        setBranches(branchData);
      }

      // 2. Fetch Products & Branch Inventory
      const { data: prodData } = await supabase.from('products').select('*').order('id');
      const { data: invData } = await supabase.from('branch_inventory').select('*');

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

      // 3. Fetch Daily Batches
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

        const branchMap: Record<number, { count: number; sales: number }> = {};

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
        }

        const comparison = (branchData || branches).map((br) => ({
          branch_id: br.id,
          name: br.name,
          code: br.code,
          import_code: br.import_code,
          active_devices: 1,
          total_sales: branchMap[br.id]?.sales || 0,
          order_count: branchMap[br.id]?.count || 0
        }));

        setAnalytics({
          filters: { branch_id: selectedBranchId, range: selectedRange, start_date: '', end_date: '' },
          kpis: {
            total_gross_revenue: totalGross,
            total_sales_count: totalOrders,
            average_order_value: totalOrders > 0 ? totalGross / totalOrders : 0,
            payment_breakdown: { cash: cashTotal, ewallet: ewalletTotal, card: cardTotal }
          },
          branch_comparison: comparison,
          top_products: []
        });
      } else {
        // Clean default 0 state
        const comparison = (branchData || branches).map((br) => ({
          branch_id: br.id,
          name: br.name,
          code: br.code,
          import_code: br.import_code,
          active_devices: 1,
          total_sales: 0,
          order_count: 0
        }));

        setAnalytics({
          filters: { branch_id: selectedBranchId, range: selectedRange, start_date: '', end_date: '' },
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
      console.warn('Supabase fetch:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Branch Save / Create
  const handleSaveBranch = async (branchData: Partial<Branch>) => {
    try {
      const { data, error } = await supabase.from('branches').upsert(branchData).select();
      if (error) throw error;
      await fetchFromSupabase();
    } catch (e: any) {
      alert('Failed to save branch: ' + e.message);
    }
  };

  // Product Save / Create (with multi-branch stock allocation)
  const handleSaveProduct = async (data: { product: Partial<Product>; branchStocks: Record<number, number> }) => {
    try {
      // 1. Upsert product
      const { data: savedProd, error: prodErr } = await supabase
        .from('products')
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

      // 2. Upsert stock for each branch
      const prodId = savedProd.id;
      for (const [branchId, stockQty] of Object.entries(data.branchStocks)) {
        await supabase.from('branch_inventory').upsert(
          {
            branch_id: Number(branchId),
            product_id: prodId,
            stock_quantity: Number(stockQty || 0),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'branch_id,product_id' }
        );
      }

      await fetchFromSupabase();
      alert('Product saved and inventory allocated to branches successfully!');
    } catch (e: any) {
      alert('Failed to save product: ' + e.message);
    }
  };

  // Restock action
  const handleRestock = async (branchId: number, productId: number, qty: number, notes: string) => {
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

      await fetchFromSupabase();
    } catch (e: any) {
      alert('Restock failed: ' + e.message);
    }
  };

  const handleImportOfflineBatch = (batchData: any) => {
    fetchFromSupabase();
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'branches'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" /> 🏢 Branches & Sunmi Import Codes
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" /> 📦 Menu Items & Stock Matrix
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> 📊 Live Sales & Overview
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'payroll'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" /> 👥 Staff & Payroll
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-4 h-4" /> 📥 Exports & Reports
          </button>
        </div>
      </nav>

      {/* 3. Tab Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'branches' && (
          <BranchSetupManager branches={branches} onSaveBranch={handleSaveBranch} />
        )}
        {activeTab === 'inventory' && (
          <InventoryMatrixTab
            branches={branches}
            items={inventoryMatrix}
            onRestock={handleRestock}
            onSaveProduct={handleSaveProduct}
          />
        )}
        {activeTab === 'sales' && <SalesOverviewTab data={analytics} branches={branches} />}
        {activeTab === 'payroll' && (
          <PayrollManagerTab
            branches={branches}
            payrollData={payrollData}
            onCalculate={async () => {}}
            onApprove={async () => {}}
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
      </main>
    </div>
  );
}
