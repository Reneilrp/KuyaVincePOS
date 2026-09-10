import React, { useState, useRef } from 'react';
import { PackagePlus, Image as ImageIcon, Upload, Link, X, Check, Eye } from 'lucide-react';
import { Branch, InventoryItem, Product } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  branches?: Branch[];
  initialProduct?: InventoryItem | null;
  onSave: (productData: {
    product: Partial<Product>;
    branchStocks?: Record<number, number | null>;
  }) => Promise<void>;
}

export const ProductFormModal: React.FC<Props> = ({
  visible,
  onClose,
  initialProduct,
  onSave
}) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Beef');
  const [basePrice, setBasePrice] = useState(String(initialProduct?.base_price || ''));
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

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
      await onSave({
        product: {
          id: initialProduct?.product_id,
          name,
          category,
          base_price: parseFloat(basePrice),
          image_url: imageUrl || undefined,
          is_active: true
        }
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg shadow-xl w-full p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-blue-400" />
              {initialProduct ? 'Edit Master Product' : 'Add Master Product'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure product details, category, default base pricing, and media
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 1. Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beef Bulalo, Chicken Sisig Meal"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 2. Category & Default Base Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Beef">Beef</option>
                <option value="Chicken">Chicken</option>
                <option value="Fish">Fish</option>
                <option value="Value Meals">Value Meals</option>
                <option value="Combo Meals">Combo Meals</option>
                <option value="Sausages">Sausages</option>
                <option value="Noodles">Noodles</option>
                <option value="Drinks">Drinks</option>
                <option value="Add-ons">Add-ons</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Base Price (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="130.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 3. Product Image Section */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Product Image
              </span>

              {/* Dual Mode Switcher Tabs */}
              <div className="flex bg-slate-200 dark:bg-slate-900 p-0.5 rounded border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    imageMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    imageMode === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded object-cover bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {uploadFileName || 'Custom Uploaded Image'}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Ready & Optimized
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Change File
                        </button>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500"
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
                    className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="py-2 space-y-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Processing & optimizing image...</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-blue-500 dark:text-blue-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Click to browse or drag & drop image
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          PNG, JPG, WebP
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Option B: Image URL */}
            {imageMode === 'url' && (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/images/beef-bulalo.jpg"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 pr-8 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {imageUrl && (
                  <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                    <img
                      src={imageUrl}
                      alt="URL Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      }}
                      className="w-10 h-10 rounded object-cover bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-mono">{imageUrl}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">External URL Linked</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Live Preview Card */}
          {name && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>🍲</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{name}</span>
                  <span className="text-xs text-slate-500">
                    ({category})
                  </span>
                </div>
                <p className="text-xs font-mono font-medium text-slate-900 dark:text-white mt-0.5">
                  ₱{basePrice ? parseFloat(basePrice || '0').toFixed(2) : '0.00'}
                </p>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Preview
              </span>
            </div>
          )}

          {/* 5. Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImage}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
