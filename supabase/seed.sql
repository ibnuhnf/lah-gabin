-- LAH GABIN SEED DATA

-- Default store config
INSERT INTO store_config (is_open, wa_number, qris_image_url, bank_account_info)
VALUES (
  true,
  '6282121498255',
  '',
  'BCA 123-456-7890 a/n Lah Gabin'
)
ON CONFLICT DO NOTHING;

-- Default admin user (id will need sync with Supabase Auth)
-- Default password: Admin123! (hashed with bcrypt cost 10)
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@lahgabin.id', '$2b$10$Tu71.aZdfnTLMdRk2PtTGOEKzDJUfVMGCFIyRbiE1/pQiAAQ6thyi', 'Admin Utama', 'admin')
ON CONFLICT DO NOTHING;

-- Expense categories
INSERT INTO expense_categories (name) VALUES
  ('Bahan Baku'),
  ('Kemasan / Packaging'),
  ('Operasional (Gas / Listrik / Air)'),
  ('Transportasi / Logistik'),
  ('Marketing / Iklan'),
  ('Lain-lain')
ON CONFLICT DO NOTHING;

-- Raw materials for Es Gabin production
INSERT INTO raw_materials (name, unit, cost_per_unit, stock_quantity) VALUES
  ('Gabin', 'pcs', 2500, 500),
  ('Susu Kental Manis', 'gram', 22, 5000),
  ('Tepung Terigu', 'gram', 12, 3000),
  ('Gula Pasir', 'gram', 14, 2000),
  ('Minyak Goreng', 'ml', 17, 5000),
  ('Es Batu', 'gram', 2, 10000),
  ('Margarin', 'gram', 30, 2000),
  ('Keju', 'gram', 90, 1500),
  ('Coklat Meises', 'gram', 75, 1000),
  ('Oreo', 'pcs', 350, 500)
ON CONFLICT DO NOTHING;

-- 8 Es Gabin variants
INSERT INTO products (name, description, base_price, hpp_per_pcs, stock_quantity, status, image_urls)
VALUES
  ('Es Gabin Coklat', 'Renyah gabin topping coklat meises legit, segar dengan es batu.', 5000, 0, 25, 'active', '[]'),
  ('Es Gabin Keju', 'Perpaduan keju gurih dan gabin renyah, dingin menyegarkan.', 5500, 0, 20, 'active', '[]'),
  ('Es Gabin Susu', 'Susu kental manis melimpah, gabin lembut nan manis.', 5000, 0, 30, 'active', '[]'),
  ('Es Gabin Tiramisu', 'Varian premium rasa tiramisu, kopi dan keju.', 7000, 0, 0, 'po_mode', '[]'),
  ('Es Gabin Matcha', 'Matcha asli Jepang dipadu susu creamy.', 6500, 0, 15, 'active', '[]'),
  ('Es Gabin Strawberry', 'Topping strawberry segar dan manis.', 6000, 0, 18, 'active', '[]'),
  ('Es Gabin Oreo', 'Crushed oreo dan krim vanilla.', 6000, 0, 0, 'po_mode', '[]'),
  ('Es Gabin Original', 'Original gabin renyah es, manis klasik.', 4000, 0, 40, 'active', '[]')
ON CONFLICT DO NOTHING;

-- Recipe for each product (yield 20 pcs per batch)
-- recipe assignments based on best guess; actual data can be edited later

INSERT INTO product_recipes (product_id, raw_material_id, qty_per_batch, batch_yield)
SELECT p.id, rm.id, 20, 20
FROM products p, raw_materials rm
WHERE p.name = 'Es Gabin Coklat' AND rm.name = 'Gabin'
ON CONFLICT DO NOTHING;

-- Sample voucher
INSERT INTO vouchers (code, discount_type, discount_value, min_order_amount, quota_total, quota_used, start_date, end_date, is_active)
VALUES (
  'WELCOME10',
  'PERCENT',
  10,
  20000,
  100,
  0,
  NOW(),
  NOW() + INTERVAL '30 days',
  true
)
ON CONFLICT DO NOTHING;
