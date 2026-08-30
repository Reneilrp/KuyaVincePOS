import React, { useState } from 'react';
import { Package, Plus, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { Branch, InventoryItem, Product } from '../types';

interface Props {
  branches: Branch[];
  items: InventoryItem[];
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  onSaveProduct: (productData: { product: Partial<Product>; branchStocks: Record<number, number> }) => Promise<void>;
}

export const InventoryMatrixTab: React.FC<Props> = ({ branches, items, onRestock, onSaveProduct }) => {
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [restockBranchId, setRestockBranchId] = useState<number>(branches[0]?.id || 1);
  const [restockQty, setRestockQty] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('Stock delivery batch');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedProduct(item);
    setRestockQty('20');
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: InventoryItem) => {
    setEditingProduct(item);
    setIsProductModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !restockQty || parseInt(restockQty, 10) <= 0) return;

    setIsSubmitting(true);
    try {
      await onRestock(restockBranchId, selectedProduct.product_id, parseInt(restockQty, 10), restockNotes);
      setSelectedProduct(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Product & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" /> Multi-Branch Stock Matrix & Products
          </h2>
          <p className="text-xs text-slate-400">
            Create items, adjust pricing, and balance stock across all branches from your laptop
          </p>
        </div>

        <button
          onClick={handleOpenNewProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat === 'all' ? '🏷️ All Products' : cat}
          </button>
        ))}
      </div>

      {/* 3. Cross-Branch Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Products Added Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the "Add New Product" button above to create your first menu item and allocate stock to your branches.
            </p>
            <button
              onClick={handleOpenNewProduct}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
            >
              <Plus className="w-4 h-4" /> Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Cost Price</th>
                  {branches.map((b) => (
                    <th key={b.id} className="p-4 text-center">
                      🏢 {b.name}
                      <span className="block text-[9px] text-blue-400 lowercase font-mono">[{b.code}]</span>
                    </th>
                  ))}
                  <th className="p-4 text-center font-bold text-white">Total Available</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const isLow = item.total_stock <= 20;

                  return (
                    <tr key={item.product_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                              ☕
                            </div>
                          )}
                          <span className="font-bold text-white text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{item.category}</td>
                      <td className="p-4 font-bold text-emerald-400">₱{item.base_price.toFixed(2)}</td>
                      <td className="p-4 text-slate-400">₱{item.cost_price.toFixed(2)}</td>
                      {branches.map((b) => {
                        const stock = item.branch_stocks[b.id] ?? 0;
                        const isBranchLow = stock <= 10;
                        return (
                          <td key={b.id} className="p-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md font-mono font-bold ${
                                isBranchLow
                                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                  : 'bg-slate-950 text-slate-200'
                              }`}
                            >
                              {stock}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${
                            isLow
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {isLow ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {item.total_stock} Units
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit Product Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRestock(item)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
                          >
                            + Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Product Create / Edit Modal */}
      <ProductFormModal
        visible={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        branches={branches}
        initialProduct={editingProduct}
        onSave={onSaveProduct}
      />

      {/* 5. Restock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📦 Restock Inventory: <span className="text-blue-400">{selectedProduct.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Deliver new stock units directly to a specific branch</p>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Destination Branch</label>
                <select
                  value={restockBranchId}
                  onChange={(e) => setRestockBranchId(Number(e.target.value))}
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
                  placeholder="e.g. 50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Restock Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Supplier delivery invoice #491"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
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
