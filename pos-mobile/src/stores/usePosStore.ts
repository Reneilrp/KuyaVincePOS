import { create } from 'zustand';
import { Branch, CartItem, Category, Device, Product, User } from '../types';

export interface StockAdjustment {
  product_id: number;
  product_name: string;
  qty_added: number;
  notes: string;
  timestamp: string;
}


interface PosState {
  // Device & Branch
  device: Device | null;
  branch: Branch | null;
  setDeviceAndBranch: (device: Device, branch: Branch) => void;

  // Cashier Session & Shift
  activeCashier: User | null;
  activeShiftId: number | null;
  setActiveCashier: (user: User | null) => void;
  setActiveShiftId: (shiftId: number | null) => void;

  // Catalog
  categories: Category[];
  products: Product[];
  selectedCategoryId: number | null;
  searchQuery: string;
  setCatalog: (categories: Category[], products: Product[]) => void;
  setSelectedCategoryId: (catId: number | null) => void;
  setSearchQuery: (query: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (productId: number, qty: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  discountAmount: number;
  setDiscountAmount: (val: number) => void;

  // Stock Adjustments audit queue
  stockAdjustments: StockAdjustment[];
  addStockAdjustment: (adj: StockAdjustment) => void;
  clearStockAdjustments: () => void;

  // Computed Math
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  device: null,
  branch: null,
  setDeviceAndBranch: (device, branch) => set({ device, branch }),

  activeCashier: null,
  activeShiftId: null,
  setActiveCashier: (activeCashier) => set({ activeCashier }),
  setActiveShiftId: (activeShiftId) => set({ activeShiftId }),

  categories: [],
  products: [],
  selectedCategoryId: null,
  searchQuery: '',
  setCatalog: (categories, products) => set({ categories, products }),
  setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  cart: [],
  discountAmount: 0,
  setDiscountAmount: (discountAmount) => set({ discountAmount }),

  stockAdjustments: [],
  addStockAdjustment: (adj) => set((s) => ({ stockAdjustments: [...s.stockAdjustments, adj] })),
  clearStockAdjustments: () => set({ stockAdjustments: [] }),

  addToCart: (product) => {
    const { cart } = get();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total_price = Math.round(newQty * updated[existingIndex].unit_price * 100) / 100;
      set({ cart: updated });
    } else {
      set({
        cart: [
          ...cart,
          {
            product,
            quantity: 1,
            unit_price: product.base_price,
            total_price: product.base_price
          }
        ]
      });
    }
  },

  updateQuantity: (productId, qty) => {
    const { cart } = get();
    if (qty <= 0) {
      set({ cart: cart.filter((item) => item.product.id !== productId) });
      return;
    }

    const updated = cart.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: qty,
          total_price: Math.round(qty * item.unit_price * 100) / 100
        };
      }
      return item;
    });
    set({ cart: updated });
  },

  removeFromCart: (productId) => {
    set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) }));
  },

  clearCart: () => set({ cart: [], discountAmount: 0 }),

  getSubtotal: () => {
    const { cart } = get();
    return Math.round(cart.reduce((sum, item) => sum + item.total_price, 0) * 100) / 100;
  },

  getTotal: () => {
    const { getSubtotal, discountAmount } = get();
    return Math.max(0, Math.round((getSubtotal() - discountAmount) * 100) / 100);
  }
}));
