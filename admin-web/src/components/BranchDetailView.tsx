import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Copy,
  Check,
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { Branch, InventoryItem, Product } from '../types';

interface Props {
  branch: Branch;
  onBack: () => void;
  masterProducts: Product[];
  branchInventory: InventoryItem[];
  onAssignProduct: (branchId: number, productId: number, stockQty: number) => Promise<void>;
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  totalBranchSales: number;
  totalBranchOrders: number;
}

export const BranchDetailView: React.FC<Props> = ({
  branch,
  onBack,
  masterProducts,
  branchInventory,
  onAssignProduct,
  onRestock,
  totalBranchSales,
  totalBranchOrders
}) => {
  const [copied, setCopied] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(masterProducts[0]?.id || 1);
  const [assignStockQty, setAssignStockQty] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restock state
  const [restockProduct, setRestockProduct] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState('20');
  const [restockNotes, setRestockNotes] = useState('Store delivery');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(branch.import_code || branch.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Products assigned to this branch
  const assignedItems = branchInventory.filter((item) => (item.branch_stocks[branch.id] ?? 0) >= 0);

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

  const totalStockCount = assignedItems.reduce((sum, i) => sum + (i.branch_stocks[branch.id] || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Branches
        </button>

        <span className="text-xs text-slate-400 font-medium">
          Branch ID #{branch.id} • Registered in Zamboanga City
        </span>
      </div>

      {/* 2. Branch Header Hero Card (Dorm-style drilldown header) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white tracking-tight">{branch.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-mono text-xs font-bold">
                  {branch.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                📍 {branch.address || 'Zamboanga City'} • 📞 {branch.phone || 'No phone set'}
              </p>
            </div>
          </div>

          {/* Sunmi Mobile Import Code Badge */}
          <div className="bg-slate-950 border-2 border-dashed border-blue-500/50 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                📱 Sunmi Mobile Import Code
              </span>
              <span className="text-lg font-mono font-black text-blue-400 tracking-widest">
                {branch.import_code || branch.code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 3. Branch Quick KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Total Branch Revenue
            </span>
            <p className="text-xl font-bold text-emerald-400 mt-1">₱{totalBranchSales.toFixed(2)}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-blue-400" /> Total Orders Completed
            </span>
            <p className="text-xl font-bold text-white mt-1">{totalBranchOrders} Orders</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" /> Available Stock on Floor
            </span>
            <p className="text-xl font-bold text-white mt-1">{totalStockCount} Units</p>
          </div>
        </div>
      </div>

      {/* 4. Branch Products & Stock List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              📦 Products & Stock at {branch.name}
            </h2>
            <p className="text-xs text-slate-400">
              Select products from your centralized Master Catalog to stock this branch
            </p>
          </div>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Assign Product from Catalog
          </button>
        </div>

        {/* Products Table for this Branch */}
        {assignedItems.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Products Assigned to this Branch</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Select an item from the centralized Master Catalog to allocate inventory to this location.
            </p>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
            >
              <Plus className="w-4 h-4" /> Select First Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Selling Price</th>
                  <th className="p-3.5 text-center">Stock at this Branch</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignedItems.map((item) => {
                  const stock = item.branch_stocks[branch.id] || 0;
                  const isLow = stock <= 10;

                  return (
                    <tr key={item.product_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-7 h-7 rounded-lg object-cover bg-slate-800" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                              ☕
                            </div>
                          )}
                          <span className="font-bold text-white text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400">{item.category}</td>
                      <td className="p-3.5 font-bold text-emerald-400">₱{item.base_price.toFixed(2)}</td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-sm text-white px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
                          {stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isLow
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {isLow ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setRestockProduct(item);
                            setRestockQty('20');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition text-xs"
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

      {/* 5. Assign Product from Master Catalog Modal (No re-typing names!) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📦 Select Product from Master Catalog
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Choose an existing item and set the stock units for <strong>{branch.name}</strong>
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Master Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {masterProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₱{p.base_price.toFixed(2)} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stock Quantity to Assign</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={assignStockQty}
                  onChange={(e) => setAssignStockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign to Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📦 Restock: <span className="text-blue-400">{restockProduct.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Delivering inventory to {branch.name}</p>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Delivery Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Weekly commissary replenishment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
