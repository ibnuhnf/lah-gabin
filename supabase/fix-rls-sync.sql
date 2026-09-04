-- ==============================================================================
-- LAH GABIN: FIX RLS & ENABLE FULL MULTI-DEVICE CLOUD SYNC
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor
-- ==============================================================================

-- 1. Pastikan ekstensi UUID aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Nonaktifkan RLS pada tabel-tabel utama agar ANON KEY diizinkan membaca & menulis
ALTER TABLE IF EXISTS store_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_mutations DISABLE ROW LEVEL SECURITY;

-- 3. Beri hak akses penuh ke role anon dan authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 4. Inisialisasi baris store_config jika belum ada
INSERT INTO store_config (id, is_open, wa_number, bank_account_info)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  true,
  '6282121498255',
  'BCA 123-456-789 a/n Lah Gabin'
)
ON CONFLICT (id) DO UPDATE 
SET is_open = EXCLUDED.is_open,
    wa_number = EXCLUDED.wa_number;

-- 5. Inisialisasi 8 Produk Utama jika tabel products masih kosong
INSERT INTO products (id, name, description, base_price, hpp_per_pcs, stock_quantity, minimum_stock, status, image_urls, unit)
VALUES 
  ('11111111-1111-1111-1111-000000000001', 'Es Gabin Coklat', 'Biskuit gabin renyah dengan isian fla coklat lembut manis.', 5000, 775, 25, 5, 'active', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000002', 'Es Gabin Keju', 'Paduan keju gurih creamy dan biskuit renyah dingin.', 5500, 800, 20, 5, 'active', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000003', 'Es Gabin Susu', 'Susu manis legit dengan sensasi dingin menyegarkan.', 5000, 700, 30, 5, 'active', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000004', 'Es Gabin Tiramisu', 'Varian premium rasa tiramisu dengan aroma kopi khas.', 7000, 1400, 0, 5, 'po_mode', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000005', 'Es Gabin Matcha', 'Matcha otentik berpadu susu lembut dan biskuit.', 6500, 1100, 15, 5, 'active', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000006', 'Es Gabin Strawberry', 'Sensasi manis asam segar buah strawberry alami.', 6000, 900, 18, 5, 'active', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000007', 'Es Gabin Oreo', 'Taburan biskuit oreo renyah dengan krim vanila lezat.', 6000, 950, 0, 5, 'po_mode', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs'),
  ('11111111-1111-1111-1111-000000000008', 'Es Gabin Original', 'Cita rasa klasik gabin legendaris yang manis renyah.', 4000, 600, 40, 5, 'active', '["/placeholder-gabin.jpg"]'::jsonb, 'pcs')
ON CONFLICT (id) DO NOTHING;

-- Selesai!
