export interface Branch {
  id: number;
  name: string;
  code: string;
  import_code: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
  settings?: {
    tax_rate: number;
    currency: string;
  };
}

export interface Device {
  id: number;
  branch_id: number;
  branch?: Branch;
  device_serial: string;
  terminal_name: string;
  device_token: string;
  status: 'online' | 'offline';
  last_seen_at?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  barcode?: string;
  image_url?: string;
  base_price: number;
  cost_price: number;
  is_active?: boolean;
}

export interface InventoryItem {
  product_id: number;
  name: string;
  category: string;
  image_url?: string;
  base_price: number;
  cost_price: number;
  branch_stocks: Record<number, number>;
  total_stock: number;
}

export interface StaffRecord {
  id: number;
  branch_id: number | null;
  name: string;
  role: string;
  pin_code: string;
  hourly_rate: number;
  is_active: boolean;
}

export interface PayrollItem {
  user_id: number;
  staff_name: string;
  role: string;
  branch_id: number;
  branch_name: string;
  period_start: string;
  period_end: string;
  hourly_rate: number;
  total_hours: number;
  gross_pay: number;
  deductions: number;
  bonuses: number;
  net_pay: number;
}

export interface TopProduct {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export interface BranchComparison {
  branch_id: number;
  name: string;
  code: string;
  import_code?: string;
  active_devices: number;
  total_sales: number;
  order_count: number;
}

export interface AnalyticsData {
  filters: {
    branch_id: string;
    range: string;
    start_date: string;
    end_date: string;
  };
  kpis: {
    total_gross_revenue: number;
    total_sales_count: number;
    average_order_value: number;
    payment_breakdown: {
      cash: number;
      ewallet: number;
      card: number;
    };
  };
  branch_comparison: BranchComparison[];
  top_products: TopProduct[];
}
