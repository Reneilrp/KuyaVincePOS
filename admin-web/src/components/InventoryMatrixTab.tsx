import React, { useState } from 'react';
import { Package, Plus, Edit2, Search, Filter } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: InventoryItem) => {
    setEditingProduct(item);
    setIsProductModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Single-row Toolbar: Search Query, Filters, and + Add Product on the very right */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search Query & Category Filters */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or category..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Category Filter Select */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 shadow-xs sm:w-48">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer w-full capitalize"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                All Categories ({items.length})
              </option>
              {categories.filter(c => c !== 'all').map((cat) => {
                const count = items.filter(i => i.category === cat).length;
                return (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white capitalize">
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Very Right Side: + Add Product Button */}
        <button
          onClick={handleOpenNewProduct}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* 2. Master Product Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">No Products Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? "No products match your search query or selected filter. Try clearing the filters or add a new product."
                : "Create your first product to see catalog items."}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={handleOpenNewProduct}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
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
