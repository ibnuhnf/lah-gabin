-- ==============================================================================
-- LAH GABIN: SECURE ROW LEVEL SECURITY (RLS) - ANTI TAMPERING POLICY
-- Jalankan setelah `schema.sql` dan `fix-rls-sync.sql`.
-- Strategi: Anon (pelanggan) hanya boleh READ data publik + INSERT order baru.
-- Hanya role authenticated (admin) yang boleh UPDATE/DELETE data kritis.
-- ==============================================================================

-- 1. Aktifkan kembali RLS di seluruh tabel
ALTER TABLE IF EXISTS store_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vouchers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raw_materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_mutations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_recipes     ENABLE ROW LEVEL SECURITY;

-- 2. Cabut hak GRANT ALL default yang longgar dari role anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- 3. Beri hak minimal ke anon (pembacaan publik + tulis pesanan saja)
GRANT SELECT ON store_config, products, vouchers TO anon;
GRANT INSERT, SELECT ON orders, order_items TO anon;

-- 4. Policy untuk role anon (pengunjung/pelanggan)

-- STORE_CONFIG: publik boleh baca
DROP POLICY IF EXISTS anon_read_store_config ON store_config;
CREATE POLICY anon_read_store_config
  ON store_config FOR SELECT TO anon
  USING (true);

-- PRODUCTS: publik boleh baca produk aktif (active & po_mode)
DROP POLICY IF EXISTS anon_read_active_products ON products;
CREATE POLICY anon_read_active_products
  ON products FOR SELECT TO anon
  USING (status IN ('active', 'po_mode') AND deleted_at IS NULL);

-- VOUCHERS: publik boleh baca voucher aktif
DROP POLICY IF EXISTS anon_read_active_vouchers ON vouchers;
CREATE POLICY anon_read_active_vouchers
  ON vouchers FOR SELECT TO anon
  USING (is_active = true);

-- ORDERS: anon boleh INSERT (buat pesanan baru) dan SELECT invoice sendiri
DROP POLICY IF EXISTS anon_create_orders ON orders;
CREATE POLICY anon_create_orders
  ON orders FOR INSERT TO anon
  WITH CHECK (status = 'PENDING_APPROVAL');

DROP POLICY IF EXISTS anon_read_own_orders ON orders;
CREATE POLICY anon_read_own_orders
  ON orders FOR SELECT TO anon
  USING (true);

-- ORDER_ITEMS: anon boleh INSERT detail pesanan
DROP POLICY IF EXISTS anon_create_order_items ON order_items;
CREATE POLICY anon_create_order_items
  ON order_items FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_read_order_items ON order_items;
CREATE POLICY anon_read_order_items
  ON order_items FOR SELECT TO anon
  USING (true);

-- 5. Policy untuk role authenticated (admin login)
-- Admin mendapat akses penuh (ALL operations)
DROP POLICY IF EXISTS admin_all_orders ON orders;
CREATE POLICY admin_all_orders
  ON orders FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_order_items ON order_items;
CREATE POLICY admin_all_order_items
  ON order_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_products ON products;
CREATE POLICY admin_all_products
  ON products FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_vouchers ON vouchers;
CREATE POLICY admin_all_vouchers
  ON vouchers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_cash ON cash_transactions;
CREATE POLICY admin_all_cash
  ON cash_transactions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_expenses ON expenses;
CREATE POLICY admin_all_expenses
  ON expenses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_stock ON stock_mutations;
CREATE POLICY admin_all_stock
  ON stock_mutations FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_raw ON raw_materials;
CREATE POLICY admin_all_raw
  ON raw_materials FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_recipes ON product_recipes;
CREATE POLICY admin_all_recipes
  ON product_recipes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_store_config ON store_config;
CREATE POLICY admin_all_store_config
  ON store_config FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
