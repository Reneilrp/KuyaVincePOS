import React, { useState } from 'react';
import { PackagePlus, Image, DollarSign, Layers } from 'lucide-react';
import { Branch, InventoryItem, Product } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  branches: Branch[];
  initialProduct?: InventoryItem | null;
  onSave: (productData: {
    product: Partial<Product>;
    branchStocks: Record<number, number>;
  }) => Promise<void>;
}

export const ProductFormModal: React.FC<Props> = ({
  visible,
  onClose,
  branches,
  initialProduct,
  onSave
}) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Coffee & Drinks');
  const [basePrice, setBasePrice] = useState(String(initialProduct?.base_price || ''));
  const [costPrice, setCostPrice] = useState(String(initialProduct?.cost_price || ''));
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url || '');
  const [branchStocks, setBranchStocks] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const b of branches) {
      initial[b.id] = String(initialProduct?.branch_stocks[b.id] ?? '50');
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleStockChange = (branchId: number, val: string) => {
    setBranchStocks((prev) => ({ ...prev, [branchId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice || parseFloat(basePrice) < 0) return;

    setIsSubmitting(true);
    try {
      const parsedStocks: Record<number, number> = {};
      for (const b of branches) {
        parsedStocks[b.id] = parseFloat(branchStocks[b.id] || '0');
      }

      await onSave({
        product: {
          id: initialProduct?.product_id,
          name,
          category,
          base_price: parseFloat(basePrice),
          cost_price: parseFloat(costPrice || '0'),
          image_url: imageUrl || undefined,
          is_active: true
        },
        branchStocks: parsedStocks
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-blue-400" />
          {initialProduct ? 'Edit Product & Pricing' : 'Add New Menu Item'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Set up item pricing, categories, and initial inventory stock across all branches
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Item / Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Iced Caramel Macchiato, Beef Tapa Bowl"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Coffee & Drinks">Coffee & Drinks</option>
                <option value="Bakery & Pastries">Bakery & Pastries</option>
                <option value="Hot Meals">Hot Meals</option>
                <option value="Quick Snacks">Quick Snacks</option>
                <option value="Desserts">Desserts</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Image URL (Optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or leave blank"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">Selling Price (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="145.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cost Price (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="45.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Initial Stock Allocation Per Branch */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" /> Initial Stock per Branch
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {branches.map((b) => (
                <div key={b.id}>
                  <label className="block text-[11px] text-slate-400 mb-1 truncate">
                    🏢 {b.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={branchStocks[b.id] ?? '0'}
                    onChange={(e) => handleStockChange(b.id, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-center font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
