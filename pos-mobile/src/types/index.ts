export interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export interface Device {
  id: number;
  branch_id: number;
  device_serial: string;
  terminal_name: string;
  device_token: string;
}

export interface User {
  id: number;
  name: string;
  role: string;
  branch_id: number | null;
}

export interface Product {
  id: number;
  category_id: number | null;
  category_name: string;
  name: string;
  barcode?: string;
  base_price: number;
  cost_price: number;
  image_url?: string;
  stock: number;
  alert_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ThermalReceiptData {
  store_header: {
    name: string;
    branch_code: string;
    address: string;
    phone: string;
  };
  order_info: {
    order_number: string;
    date_time: string;
    cashier: string;
    payment_method: string;
  };
  items: Array<{
    name: string;
    qty: number;
    unit_price: string;
    total_price: string;
  }>;
  totals: {
    subtotal: string;
    discount: string;
    total: string;
    amount_tendered: string;
    change: string;
  };
  footer: {
    message: string;
    notice: string;
  };
}
