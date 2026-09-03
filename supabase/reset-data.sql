-- ==============================================================================
-- LAH GABIN: DATABASE RESET SCRIPT
-- Jalankan skrip ini di Supabase SQL Editor untuk mengosongkan semua transaksi
-- ==============================================================================

-- 1. Matikan trigger sementara agar cascade truncate berjalan mulus
ALTER TABLE IF EXISTS order_items DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS orders DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS cash_transactions DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS expenses DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS stock_mutations DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS vouchers DISABLE TRIGGER ALL;

-- 2. Kosongkan semua tabel transaksional
TRUNCATE TABLE 
  order_items,
  orders,
  cash_transactions,
  expenses,
  stock_mutations,
  vouchers
RESTART IDENTITY CASCADE;

-- 3. Aktifkan kembali trigger
ALTER TABLE IF EXISTS order_items ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS orders ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS cash_transactions ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS expenses ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS stock_mutations ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS vouchers ENABLE TRIGGER ALL;

-- 4. Set Saldo Kas Awal = 0 (Buku Kas Bersih)
-- (Tidak ada transaksi, total saldo = Rp 0)

-- 5. Optional: Jika ingin reset stok produk ke 0 juga, uncomment baris di bawah:
-- UPDATE products SET stock_quantity = 0;

-- Selesai. Database kembali ke kondisi awal (fresh).
