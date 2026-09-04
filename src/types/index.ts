export type BarVariant = 'GABIN_BAR' | 'CRACKERS';

export const BAR_VARIANT_LABELS: Record<BarVariant, string> = {
  GABIN_BAR: 'Gabin Bar',
  CRACKERS: 'Crackers',
};

export interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  discount_price: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  hpp_per_pcs: number;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  status: 'active' | 'inactive' | 'po_mode';
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeItem {
  id: string;
  product_id: string;
  material_id: string;
  quantity_required: number;
  unit: string;
  material?: Material;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  created_by: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  quota: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus =
  | 'PENDING_APPROVAL'
  | 'DITERIMA_PROSES'
  | 'DIPROSES'
  | 'SELESAI'
  | 'DIBATALKAN';

export type PaymentMethod = 'QRIS' | 'CASH' | 'TRANSFER';

export type OrderSource = 'ONLINE' | 'POS';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price_snapshot: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Order {
  id: string;
  invoice_code: string;
  customer_name: string;
  customer_wa: string;
  customer_notes: string | null;
  customer_address?: string | null;
  delivery_zone?: 'LUAR_PERUM' | 'DALAM_PERUM' | string | null;
  delivery_fee?: number;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  payment_proof_url?: string | null;
  status: OrderStatus;
  voucher_id?: string | null;
  order_source: OrderSource;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
}

export interface StockMutation {
  id: string;
  item_type: 'PRODUCT' | 'MATERIAL';
  item_id: string;
  mutation_type:
    | 'MASUK_PEMBELIAN'
    | 'KELUAR_PENJUALAN'
    | 'KELUAR_PRODUKSI'
    | 'PENYESUAIAN_RUSAK'
    | 'PENYESUAIAN_HILANG';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface CashClosing {
  id: string;
  closing_date: string;
  total_cash_expected: number;
  total_cash_actual: number;
  total_qris_expected: number;
  difference_amount: number;
  notes: string | null;
  closed_by: string;
  created_at: string;
}

export interface StoreConfig {
  id: string;
  is_open: boolean;
  po_notes: string;
  po_delivery_date: string | null;
  wa_number: string;
  qris_image_url: string;
  bank_account_info: string;
  updated_at: string;
}
