import React, { useState, useRef } from 'react';
import { PackagePlus, Image as ImageIcon, Layers, Upload, Link, X, Check, Eye } from 'lucide-react';
import { Branch, InventoryItem, Product } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

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

  // Dual Image Options: 'upload' | 'url'
  const isDataUrl = initialProduct?.image_url?.startsWith('data:image/');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>(
    initialProduct?.image_url ? (isDataUrl ? 'upload' : 'url') : 'upload'
  );

  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Compress & optimize image for fast cloud sync and lightweight mobile rendering
  const processImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file is not an image.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = async () => {
          // Resize if width/height exceeds 600px
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Try uploading to Supabase Storage if configured
          if (isSupabaseConfigured) {
            try {
              const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
              const blob = await (await fetch(compressedDataUrl)).blob();
              const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('products')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

              if (!uploadErr && uploadData?.path) {
                const { data: publicUrlData } = supabase.storage
                  .from('products')
                  .getPublicUrl(uploadData.path);

                if (publicUrlData?.publicUrl) {
                  resolve(publicUrlData.publicUrl);
                  return;
                }
              }
            } catch {
              // Fallback to data URL
            }
          }

          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Could not load image.'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reading error.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadFileName(file.name);
    setIsProcessingImage(true);

    try {
      const finalUrl = await processImageFile(file);
      setImageUrl(finalUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadFileName(file.name);
    setIsProcessingImage(true);

    try {
      const finalUrl = await processImageFile(file);
      setImageUrl(finalUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setUploadFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-blue-400" />
              {initialProduct ? 'Edit Product & Pricing' : 'Add New Menu Item'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Set up item pricing, categories, image media, and branch inventory
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Item / Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Iced Caramel Macchiato, Beef Tapa Bowl"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* 2. Category & Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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
              <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">Selling Price (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="145.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 3. Product Image Section with Dual Option (Upload vs URL) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Product Image
              </span>

              {/* Dual Mode Switcher Tabs */}
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                    imageMode === 'upload'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                    imageMode === 'url'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" /> Image URL
                </button>
              </div>
            </div>

            {/* Option A: Upload File */}
            {imageMode === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-lg object-cover bg-slate-950 border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {uploadFileName || 'Custom Uploaded Image'}
                      </p>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Ready & Optimized
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline"
                        >
                          Change File
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="py-2 space-y-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-slate-400">Processing & optimizing image...</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-blue-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200">
                          Click to browse or drag & drop image
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Supports PNG, JPG, WebP (auto-optimized for Sunmi POS)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Option B: Image URL */}
            {imageMode === 'url' && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/images/iced-coffee.jpg"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-9 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {imageUrl && (
                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <img
                      src={imageUrl}
                      alt="URL Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      }}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate">{imageUrl}</p>
                      <p className="text-[10px] text-emerald-400">External URL Linked</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Live Preview Card */}
          {name && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">☕</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                    {category}
                  </span>
                </div>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">
                  ₱{basePrice ? parseFloat(basePrice || '0').toFixed(2) : '0.00'}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-400" /> POS Card Preview
              </span>
            </div>
          )}

          {/* 5. Initial Stock Allocation Per Branch */}
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

          {/* 6. Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImage}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Saving...'
              ) : initialProduct ? (
                'Update Product'
              ) : (
                <>
                  <Check className="w-4 h-4" /> Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
