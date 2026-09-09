import React, { useState } from 'react';
import { Package, Plus, Edit2 } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { Branch, InventoryItem, Product } from '../types';

interface Props {
  branches: Branch[];
  items: InventoryItem[];
  onRestock: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  onSaveProduct: (productData: { product: Partial<Product>; branchStocks: Record<number, number | null> }) => Promise<void>;
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" /> Stock Matrix & Products
          </h2>
          <p className="text-xs text-slate-400">
            Create items, adjust pricing, and manage stock allocations across all branches
          </p>
        </div>

        <button
          onClick={handleOpenNewProduct}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
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
            className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat === 'all' ? 'All Products' : cat}
          </button>
        ))}
      </div>

      {/* 3. Cross-Branch Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-8 h-8 mx-auto text-slate-500" />
            <h3 className="text-sm font-medium text-slate-200">No Products Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first product or adjust category filters to see items.
            </p>
            <button
              onClick={handleOpenNewProduct}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-xs font-medium text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Cost</th>
                  {branches.map((b) => (
                    <th key={b.id} className="p-3.5 text-center">
                      {b.name}
                      <span className="block text-xs font-mono text-slate-500">[{b.code}]</span>
                    </th>
                  ))}
                  <th className="p-3.5 text-center">Total Stock</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map((item) => {
                  const isLow = item.total_stock <= 20;

                  return (
                    <tr key={item.product_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-7 h-7 rounded object-cover bg-slate-800" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                              ☕
                            </div>
                          )}
                          <span className="text-sm font-normal text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400">{item.category}</td>
                      <td className="p-3.5 font-mono text-slate-200">₱{item.base_price.toFixed(2)}</td>
                      <td className="p-3.5 font-mono text-slate-400">₱{item.cost_price.toFixed(2)}</td>
                      {branches.map((b) => {
                        const isExcluded = item.excluded_branch_ids?.includes(b.id) ?? false;
                        const stock = item.branch_stocks[b.id] ?? 0;
                        const isBranchLow = stock <= 10;
                        return (
                          <td key={b.id} className="p-3.5 text-center font-mono">
                            {!isExcluded ? (
                              <span className={isBranchLow ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                                {stock}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3.5 text-center font-mono font-medium">
                        <span className={isLow ? 'text-rose-400' : 'text-slate-200'}>
                          {item.total_stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(item)}
                            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Product Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRestock(item)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-medium rounded text-xs transition-colors"
                          >
                            Restock
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Restock: {selectedProduct.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Allocate stock to a specific branch</p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination Branch</label>
                <select
                  value={restockBranchId}
                  onChange={(e) => setRestockBranchId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} [{b.code}] (Current: {selectedProduct.branch_stocks[b.id] ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Supplier delivery invoice #491"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
