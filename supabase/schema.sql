-- LAH GABIN COMPLETE SUPABASE SQL SCHEMA
-- Run this in Supabase SQL Editor

-- 0. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PENDING_APPROVAL',
    'DITERIMA_PROSES',
    'DIPROSES',
    'SELESAI',
    'DIBATALKAN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE availability_status AS ENUM (
    'active',
    'po_mode',
    'inactive'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'CASH',
    'TRANSFER',
    'QRIS'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_mutation_type AS ENUM (
    'MASUK_PEMBELIAN',
    'MASUK_PRODUKSI',
    'KELUAR_PENJUALAN',
    'WASTE',
    'PENYESUAIAN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. USERS & CONFIG
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'kasir')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS store_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_open BOOLEAN DEFAULT false,
  wa_number VARCHAR(20) NOT NULL DEFAULT '6282121498255',
  qris_image_url TEXT,
  bank_account_info TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- 2. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(12,2) NOT NULL,
  discount_price DECIMAL(12,2),
  discount_start_date TIMESTAMPTZ,
  discount_end_date TIMESTAMPTZ,
  hpp_per_pcs DECIMAL(12,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  minimum_stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pcs',
  status availability_status DEFAULT 'active',
  image_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  cost_per_unit DECIMAL(12,2) NOT NULL,
  stock_quantity DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE RESTRICT,
  qty_per_batch DECIMAL(12,2) NOT NULL,
  batch_yield INTEGER NOT NULL CHECK (batch_yield > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DISCOUNTS & VOUCHERS
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(10) CHECK (discount_type IN ('FIXED', 'PERCENT')),
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_discount_amount DECIMAL(12,2),
  quota_total INTEGER NOT NULL,
  quota_used INTEGER DEFAULT 0 CHECK (quota_used <= quota_total),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_wa VARCHAR(20) NOT NULL,
  customer_notes TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'QRIS',
  status order_status DEFAULT 'PENDING_APPROVAL',
  voucher_id UUID REFERENCES vouchers(id),
  order_source VARCHAR(10) DEFAULT 'ONLINE' CHECK (order_source IN ('ONLINE', 'POS')),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_code ON orders(invoice_code);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(100) NOT NULL,
  price_snapshot DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(12,2) NOT NULL
);

-- 5. STOCK MUTATIONS & LEDGER
CREATE TABLE IF NOT EXISTS stock_mutations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  raw_material_id UUID REFERENCES raw_materials(id),
  mutation_type stock_mutation_type NOT NULL,
  quantity_change DECIMAL(12,2) NOT NULL,
  stock_before DECIMAL(12,2) NOT NULL,
  stock_after DECIMAL(12,2) NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCE & EXPENSES
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  expense_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) CHECK (type IN ('IN', 'OUT')),
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STORED PROCEDURES / FUNCTIONS

-- ACC Order & Deduct Stock Atomically
CREATE OR REPLACE FUNCTION acc_order_and_deduct_stock(
  p_order_id UUID,
  p_approved_by UUID
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item RECORD;
  v_current_stock INTEGER;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order tidak ditemukan');
  END IF;

  IF v_order.status != 'PENDING_APPROVAL' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hanya order PENDING_APPROVAL yang bisa di-ACC');
  END IF;

  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
    SELECT stock_quantity INTO v_current_stock FROM products WHERE id = v_item.product_id FOR UPDATE;
    
    IF v_current_stock < v_item.quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Stok tidak cukup untuk produk: ' || v_item.product_name);
    END IF;

    UPDATE products 
    SET stock_quantity = stock_quantity - v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;

    INSERT INTO stock_mutations (
      product_id, mutation_type, quantity_change, stock_before, stock_after, reference_id, notes
    ) VALUES (
      v_item.product_id, 'KELUAR_PENJUALAN', -v_item.quantity, v_current_stock, v_current_stock - v_item.quantity, p_order_id, 'ACC Order Online ' || v_order.invoice_code
    );
  END LOOP;

  UPDATE orders
  SET status = 'DITERIMA_PROSES',
      approved_by = p_approved_by,
      approved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id;

  INSERT INTO cash_transactions (type, amount, category, reference_id, description)
  VALUES ('IN', v_order.final_amount, 'PENJUALAN_ONLINE', p_order_id, 'Penjualan ' || v_order.invoice_code);

  RETURN jsonb_build_object('success', true, 'message', 'Order berhasil di-ACC dan stok terpotong');
END;
$$;

-- Trigger Recalculate HPP
CREATE OR REPLACE FUNCTION trigger_recalc_hpp_on_material_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_prod RECORD;
  v_new_hpp DECIMAL(12,2);
BEGIN
  FOR v_prod IN SELECT DISTINCT product_id, batch_yield FROM product_recipes WHERE raw_material_id = NEW.id LOOP
    SELECT COALESCE(SUM(pr.qty_per_batch * rm.cost_per_unit) / v_prod.batch_yield, 0)
    INTO v_new_hpp
    FROM product_recipes pr
    JOIN raw_materials rm ON rm.id = pr.raw_material_id
    WHERE pr.product_id = v_prod.product_id;

    UPDATE products SET hpp_per_pcs = v_new_hpp, updated_at = NOW() WHERE id = v_prod.product_id;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_hpp_on_raw_material ON raw_materials;
CREATE TRIGGER trg_recalc_hpp_on_raw_material
AFTER UPDATE OF cost_per_unit ON raw_materials
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_hpp_on_material_change();
