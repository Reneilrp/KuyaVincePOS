import React, { useState } from 'react';
import { Package, Plus, Edit2 } from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { Branch, InventoryItem, Product } from '../types';

interface Props {
  branches?: Branch[];
  items: InventoryItem[];
  onRestock?: (branchId: number, productId: number, qty: number, notes: string) => Promise<void>;
  onSaveProduct: (productData: { product: Partial<Product>; branchStocks?: Record<number, number | null> }) => Promise<void>;
}

export const InventoryMatrixTab: React.FC<Props> = ({ branches = [], items, onSaveProduct }) => {
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: InventoryItem) => {
    setEditingProduct(item);
    setIsProductModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Add Product & Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Master Product Catalog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage global product definitions, categories, and default base selling prices
          </p>
        </div>

        <button
          onClick={handleOpenNewProduct}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {cat === 'all' ? 'All Products' : cat}
          </button>
        ))}
      </div>

      {/* 3. Master Product Catalog Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">No Products Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create your first product or adjust category filters to see catalog items.
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
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Default Base Price</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm">
                            🍲
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-slate-900 dark:text-slate-200 text-sm">
                      ₱{item.base_price.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEditProduct(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium transition-colors"
                        title="Edit Master Product"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};
