import React, { useState } from 'react';
import { PackagePlus, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { Branch, InventoryItem } from '../types';

interface Props {
  branches: Branch[];
  items: InventoryItem[];
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
}

export const InventoryMatrixTab: React.FC<Props> = ({ branches, items, onRestock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<number>(branches[0]?.id || 1);
  const [restockQty, setRestockQty] = useState('50');
  const [notes, setNotes] = useState('Central Warehouse Batch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedProduct(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !restockQty || parseFloat(restockQty) <= 0) return;

    setIsSubmitting(true);
    try {
      await onRestock(targetBranchId, selectedProduct.product_id, parseFloat(restockQty), notes);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Restock failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search & Restock trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            📦 Cross-Branch Inventory Matrix
          </h2>
          <p className="text-xs text-slate-400">Live per-branch stock balance and threshold alerts</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stock by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                {branches.map((b) => (
                  <th key={b.id} className="py-3.5 px-4 text-center">
                    🏢 {b.name} <span className="text-blue-400">[{b.code}]</span>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-center font-bold text-white">Total Available</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr key={item.product_id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                  <td className="py-3 px-4 text-slate-400">{item.category}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-200">₱{item.base_price.toFixed(2)}</td>

                  {/* Branch Stocks */}
                  {branches.map((b) => {
                    const stock = item.branch_stocks[b.id] ?? 0;
                    const isLow = stock <= 10 && stock > 0;
                    const isOut = stock <= 0;

                    return (
                      <td key={b.id} className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          isOut
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                            : isLow
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-950 text-emerald-400 border border-slate-800'
                        }`}>
                          {isOut && <AlertTriangle className="w-3 h-3" />}
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {!isOut && !isLow && <CheckCircle2 className="w-3 h-3" />}
                          {stock}
                        </span>
                      </td>
                    );
                  })}

                  <td className="py-3 px-4 text-center font-bold text-white">
                    {item.total_stock} units
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenRestock(item)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition"
                    >
                      <PackagePlus className="w-3.5 h-3.5" /> Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📦 Restock Inventory
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adding new inventory for <span className="text-blue-400 font-semibold">{selectedProduct.name}</span>
            </p>

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Branch</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} [{b.code}] (Current: {selectedProduct.branch_stocks[b.id] ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notes / Batch Ref</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
