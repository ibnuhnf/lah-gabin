export type OrderStatus =
  | 'PENDING_APPROVAL'
  | 'DITERIMA_PROSES'
  | 'DIPROSES'
  | 'SELESAI'
  | 'DIBATALKAN';

export type AvailabilityStatus = 'active' | 'po_mode' | 'inactive';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS';

export type StockMutationType =
  | 'MASUK_PEMBELIAN'
  | 'MASUK_PRODUKSI'
  | 'KELUAR_PENJUALAN'
  | 'WASTE'
  | 'PENYESUAIAN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kasir';
  created_at: string;
}

export interface StoreConfig {
  id: string;
  is_open: boolean;
  wa_number: string;
  qris_image_url?: string;
  bank_account_info?: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  discount_price: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  hpp_per_pcs: number;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  status: AvailabilityStatus;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRecipe {
  id: string;
  product_id: string;
  raw_material_id: string;
  qty_per_batch: number;
  batch_yield: number;
  raw_material?: RawMaterial;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'FIXED' | 'PERCENT';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  quota_total: number;
  quota_used: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  price_snapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  invoice_code: string;
  customer_name: string;
  customer_wa: string;
  customer_notes?: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  voucher_id?: string | null;
  order_source: 'ONLINE' | 'POS';
  cancelled_reason?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface StockMutation {
  id: string;
  product_id?: string;
  raw_material_id?: string;
  mutation_type: StockMutationType;
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  description: string;
  receipt_url?: string;
  expense_date: string;
  created_at: string;
  category?: ExpenseCategory;
}

export interface CashTransaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}
