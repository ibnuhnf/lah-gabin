# Arsitektur & Implementasi Sistem "Lah Gabin"

## 1. ERD & Skema Database Relasional Lengkap (PostgreSQL / Supabase)

Skema database dirancang untuk Supabase menggunakan PostgreSQL. Ini menggunakan UUID untuk referensi, dan JSONB untuk snaphot data pada transaksi agar tidak berubah secara retrospektif (auditability).

```sql
-- ENUMS
CREATE TYPE order_status AS ENUM (
  'PENDING_APPROVAL',
  'DITERIMA_PROSES',
  'DIPROSES',
  'SELESAI',
  'DIBATALKAN'
);

CREATE TYPE availability_status AS ENUM (
  'active',
  'po_mode',
  'inactive'
);

CREATE TYPE payment_method AS ENUM (
  'CASH',
  'TRANSFER',
  'QRIS'
);

CREATE TYPE stock_mutation_type AS ENUM (
  'MASUK_PEMBELIAN',
  'MASUK_PRODUKSI',
  'KELUAR_PENJUALAN',
  'WASTE',
  'PENYESUAIAN'
);

-- 1. USERS & CONFIG
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- Di-manage oleh Supabase Auth biasanya
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'kasir')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE TABLE store_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_open BOOLEAN DEFAULT false,
  wa_number VARCHAR(20) NOT NULL, -- e.g., '6282121498255'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);
-- Hanya 1 row aktif
CREATE UNIQUE INDEX idx_store_config_single_row ON store_config ((1));


-- 2. PRODUCTS & INVENTORY
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(12,2) NOT NULL,
  discount_price DECIMAL(12,2),
  discount_start_date TIMESTAMPTZ,
  discount_end_date TIMESTAMPTZ,
  hpp_per_pcs DECIMAL(12,2) DEFAULT 0, -- Cache dari kalkulasi resep
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  minimum_stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pcs',
  status availability_status DEFAULT 'active',
  image_urls JSONB DEFAULT '[]', -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_products_status ON products(status);

CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- gram, ml, pcs
  cost_per_unit DECIMAL(12,2) NOT NULL,
  stock_quantity DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE product_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE RESTRICT,
  qty_per_batch DECIMAL(12,2) NOT NULL,
  batch_yield INTEGER NOT NULL CHECK (batch_yield > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. PROMO
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('FLAT', 'PERCENTAGE')),
  discount_value DECIMAL(12,2) NOT NULL,
  max_discount_amount DECIMAL(12,2), -- Limit max untuk percentage
  min_purchase_amount DECIMAL(12,2) DEFAULT 0,
  quota_total INTEGER NOT NULL,
  quota_used INTEGER DEFAULT 0 CHECK (quota_used <= quota_total),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vouchers_code_active ON vouchers(code) WHERE is_active = true;


-- 4. ORDERS & TRANSACTIONS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code VARCHAR(30) UNIQUE NOT NULL, -- LG-20231024-XXXX
  customer_name VARCHAR(100) NOT NULL,
  customer_wa VARCHAR(20) NOT NULL,
  customer_notes TEXT,
  
  subtotal DECIMAL(12,2) NOT NULL,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  voucher_discount DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  
  status order_status DEFAULT 'PENDING_APPROVAL',
  payment_method payment_method, -- Diisi admin saat ACC
  cancel_reason TEXT,
  source VARCHAR(20) DEFAULT 'WEB' CHECK (source IN ('WEB', 'POS')),
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_code ON orders(order_code);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Snapshot untuk konsistensi histori (jangan referensi master saat kalkulasi laporan)
  product_name VARCHAR(100) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_at_order DECIMAL(12,2) NOT NULL, -- Harga final per item (bisa harga diskon)
  hpp_at_order DECIMAL(12,2) NOT NULL,   -- HPP saat order dibuat untuk laporan Laba Rugi
  subtotal DECIMAL(12,2) NOT NULL
);


-- 5. LEDGER & MUTASI
CREATE TABLE stock_mutations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  -- Check: Hanya salah satu yang terisi
  CHECK ((product_id IS NOT NULL AND raw_material_id IS NULL) OR (product_id IS NULL AND raw_material_id IS NOT NULL)),
  
  mutation_type stock_mutation_type NOT NULL,
  qty_change DECIMAL(12,2) NOT NULL, -- Positif untuk masuk, Negatif untuk keluar
  balance_after DECIMAL(12,2) NOT NULL,
  reference_id UUID, -- Bisa order_id, purchase_id, dll
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true
);
-- Seed: Bahan Baku, Kemasan, Operasional, Transportasi, Marketing, Lain-lain

CREATE TABLE cash_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('IN', 'OUT')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(12,2) NOT NULL,
  
  category_id UUID REFERENCES expense_categories(id), -- Null jika IN dari order
  reference_id UUID, -- Order ID (jika IN dari sales)
  
  title VARCHAR(255) NOT NULL,
  receipt_image_url VARCHAR(255),
  date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

## 2. Rekomendasi Tech Stack & Justifikasi

- **Frontend & Backend (API)**: **Next.js 14 (App Router)**
  - *Justifikasi*: UMKM/tim kecil butuh stack terpadu. App Router dengan Server Actions memudahkan mutasi data (checkout, ACC order) tanpa perlu menulis endpoint API terpisah. Cepat dibangun, SEO friendly (jika katalog butuh di-index), dan gampang deploy.
- **Database, Auth, & Storage**: **Supabase (PostgreSQL)**
  - *Justifikasi*: Relational DB sangat kritikal untuk akuntansi/ledger (ACID compliance). Supabase menyediakan PostgreSQL out-of-the-box, lengkap dengan Auth untuk admin dan Storage (S3-compatible) untuk foto produk & nota pengeluaran.
  - *Note*: Kita menggunakan Supabase JS Client langsung (tanpa Prisma ORM) demi simplicitas instalasi dan keeping the bundle small untuk tim kecil.
- **Client-Side PDF Generation**: **jsPDF + jspdf-autotable**
  - *Justifikasi*: Ukuran sangat ringan, murni jalan di sisi client (browser HP). `jspdf-autotable` membuat pembuatan layout invoice tabel-tabel item sangat mudah. Tidak butuh server rendering sehingga menekan cost server.
- **Hosting**: **Vercel**
  - *Justifikasi*: Zero-config untuk Next.js. Free tier (Hobby) sanggup menangani trafik UMKM menengah (ratusan checkout per hari) dengan caching optimal untuk katalog publik.

## 3. Arsitektur & Alur Data

### Struktur Proyek
**Monorepo** (Satu aplikasi Next.js).
*Kenapa?* Berbagi tipe data (TypeScript) dan komponen UI (buttons, cards) lebih mudah. Routing bisa dipisah simpel: `/(customer)` untuk publik, dan `/admin` dilindungi middleware auth.

### Alur Data Kritis

**A. Proses Checkout Customer → PDF & WA**
1. Customer keranjang di LocalStorage/Zustand.
2. Klik "Pesan" → Hit endpoint / Server Action `checkout`.
3. Server: Validasi ketersediaan stok & voucher. (Database check)
4. Server: Insert ke `orders` (Status `PENDING_APPROVAL`) & `order_items`. (Mengambil snapshot harga/HPP).
5. Server: Kembalikan `order_code` dan data invoice ke client.
6. Client (Browser): Terima response, panggil `jsPDF`, generate PDF, simpan/download otomatis.
7. Client: Arahkan ke URL `wa.me/62...` dengan teks invoice yang di-encode URI.

**B. Proses ACC Order oleh Admin → Pengurangan Stok**
1. Admin di Dashboard lihat Order Queue, klik "Terima/ACC".
2. Kirim ke Server Action `approveOrder(order_id)`.
3. Server: Mulai **Database Transaction**.
4. Cek apakah status masih `PENDING_APPROVAL`.
5. Kurangi `stock_quantity` di tabel `products`. Jika stok jadi < 0, lempar error (Rollback).
6. Update status order menjadi `DITERIMA_PROSES`.
7. Catat di tabel `stock_mutations` dengan tipe `KELUAR_PENJUALAN`.
8. Commit transaksi. Notifikasi sukses ke admin.

**C. Proses Hitung HPP Otomatis**
1. Admin mengubah Harga Beli di `raw_materials`.
2. Supabase Database Trigger (ATAU Server Action) mencari semua `product_recipes` yang mengandung bahan baku tersebut.
3. Hitung ulang: `(Sum(cost_per_unit * qty_per_batch) / batch_yield)`.
4. Update `hpp_per_pcs` di tabel `products`.
5. *Note*: HPP di `orders` lama tidak berubah karena sudah di-snapshot di tabel `order_items` (Kolom `hpp_at_order`).


## 4. State Machine Order

Status Flow:
`PENDING_APPROVAL` → `DITERIMA_PROSES` → `DIPROSES` → `SELESAI`
*(Atau dibatalkan di titik manapun sebelum Selesai)*

| Status Asal | Aksi Admin | Status Tujuan | Trigger Sistem Ekstra |
| :--- | :--- | :--- | :--- |
| `PENDING_APPROVAL` | Terima Order | `DITERIMA_PROSES` | Kurangi Stok, Insert Ledger Penjualan (Piutang/Kas) |
| `PENDING_APPROVAL` | Tolak | `DIBATALKAN` | - |
| `DITERIMA_PROSES` | Mulai Buat | `DIPROSES` | - |
| `DITERIMA_PROSES` | Batal | `DIBATALKAN` | Kembalikan Stok (Rollback) |
| `DIPROSES` | Selesai / Diambil | `SELESAI` | - |
| `DIPROSES` | Batal | `DIBATALKAN` | Kembalikan Stok (Tergantung kebijakan waste) |
| `SELESAI` | - | - | Status Final, tidak bisa transisi |
| `DIBATALKAN` | - | - | Status Final, tidak bisa transisi |


## 5. Implementasi Kode Inti (TypeScript / Next.js)

### A. Client-Side PDF Generation (jsPDF)

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (order: any, customer: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('LAH GABIN - INVOICE', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Kode Order: ${order.order_code}`, 14, 30);
  doc.text(`Tanggal: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`, 14, 35);
  doc.text(`Pemesan: ${customer.name} (${customer.wa})`, 14, 40);
  
  // Table Items
  const tableData = order.items.map((item: any) => [
    item.product_name,
    item.qty.toString(),
    `Rp ${item.price.toLocaleString('id-ID')}`,
    `Rp ${item.subtotal.toLocaleString('id-ID')}`
  ]);

  (doc as any).autoTable({
    startY: 50,
    head: [['Produk', 'Qty', 'Harga', 'Subtotal']],
    body: tableData,
    foot: [
      ['', '', 'Subtotal', `Rp ${order.subtotal.toLocaleString('id-ID')}`],
      ['', '', 'Diskon/Voucher', `- Rp ${order.voucher_discount.toLocaleString('id-ID')}`],
      ['', '', 'TOTAL', `Rp ${order.grand_total.toLocaleString('id-ID')}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Footer Instructions
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('INSTRUKSI PEMBAYARAN:', 14, finalY);
  doc.text('1. BCA: 123456789 a/n Lah Gabin', 14, finalY + 5);
  doc.text('2. Pesanan Anda belum diproses sebelum konfirmasi dari Admin.', 14, finalY + 10);
  
  // Auto-download
  doc.save(`Invoice_${order.order_code}.pdf`);
};
```

### B. Konstruksi URL WhatsApp yang Aman

```typescript
export const getWhatsAppRedirectURL = (adminPhone: string, orderCode: string, customerName: string) => {
  // Pastikan adminPhone formatnya benar, mis: '6282121498255'
  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
  
  const messageTemplate = 
`Halo Lah Gabin! 👋
Saya ingin mengonfirmasi pesanan saya.

Nama: *${customerName}*
Kode Order: *${orderCode}*

_Saya telah melampirkan file PDF Invoice di pesan ini._
Mohon di-ACC ya, terima kasih!`;

  // Encode text agar newline (%0A) dan spasi (%20) aman di URL
  const encodedMessage = encodeURIComponent(messageTemplate);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

// Penggunaan di UI:
// <a href={getWhatsAppRedirectURL('6282121498255', 'LG-2023-1234', 'Budi')} target="_blank">Kirim WA</a>
```

### C. Validasi Voucher dengan Konkurensi

```typescript
import { supabase } from '@/lib/supabaseClient';

export async function validateAndApplyVoucher(code: string, cartTotal: number) {
  // Gunakan lock/select untuk memastikan validasi (Dalam implementasi nyata, lebih baik di Store Procedure/RPC)
  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !voucher) return { error: 'Voucher tidak ditemukan atau sudah tidak aktif.' };
  
  if (new Date() < new Date(voucher.start_date)) return { error: 'Voucher belum berlaku.' };
  if (new Date() > new Date(voucher.end_date)) return { error: 'Voucher sudah kadaluarsa.' };
  
  if (voucher.quota_used >= voucher.quota_total) return { error: 'Kuota voucher sudah habis.' };
  
  if (cartTotal < voucher.min_purchase_amount) {
    return { error: `Minimal belanja Rp ${voucher.min_purchase_amount.toLocaleString('id-ID')} untuk voucher ini.` };
  }

  // Kalkulasi diskon
  let discountAmount = 0;
  if (voucher.discount_type === 'FLAT') {
    discountAmount = voucher.discount_value;
  } else if (voucher.discount_type === 'PERCENTAGE') {
    discountAmount = cartTotal * (voucher.discount_value / 100);
    if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
      discountAmount = voucher.max_discount_amount;
    }
  }

  return { success: true, discountAmount, voucherId: voucher.id };
}
```

### D. Pengurangan Stok Otomatis Saat ACC (Supabase RPC / Stored Procedure)
Untuk menghindari race condition saat dua admin menekan ACC bersamaan, pengurangan stok **harus** dilakukan di level database (Atomic operation).

```sql
-- Didefinisikan di Supabase SQL Editor
CREATE OR REPLACE FUNCTION acc_order_and_deduct_stock(p_order_id UUID, p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
  v_current_stock INTEGER;
BEGIN
  -- 1. Lock order row agar admin lain tidak bisa ACC bersamaan
  PERFORM id FROM orders WHERE id = p_order_id AND status = 'PENDING_APPROVAL' FOR UPDATE NOWAIT;
  
  -- 2. Looping setiap item di order
  FOR v_item IN SELECT product_id, qty FROM order_items WHERE order_id = p_order_id LOOP
    
    -- Lock product row
    SELECT stock_quantity INTO v_current_stock FROM products WHERE id = v_item.product_id FOR UPDATE;
    
    IF v_current_stock < v_item.qty THEN
      RAISE EXCEPTION 'Stok tidak mencukupi untuk produk ID %', v_item.product_id;
    END IF;
    
    -- Kurangi stok
    UPDATE products SET stock_quantity = stock_quantity - v_item.qty WHERE id = v_item.product_id;
    
    -- Catat Mutasi
    INSERT INTO stock_mutations (product_id, mutation_type, qty_change, balance_after, reference_id, created_by)
    VALUES (v_item.product_id, 'KELUAR_PENJUALAN', -v_item.qty, (v_current_stock - v_item.qty), p_order_id, p_admin_id);
    
  END LOOP;

  -- 3. Update status order
  UPDATE orders 
  SET status = 'DITERIMA_PROSES', approved_by = p_admin_id, approved_at = NOW() 
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;
```
*(Dipanggil dari Next.js Server Action: `await supabase.rpc('acc_order_and_deduct_stock', { p_order_id: id, p_admin_id: adminId })`)*

### E. Engine Kalkulasi HPP (Supabase Trigger)

```sql
CREATE OR REPLACE FUNCTION recalculate_product_hpp()
RETURNS TRIGGER AS $$
DECLARE
  v_new_hpp DECIMAL(12,2);
BEGIN
  -- Hitung ulang untuk SEMUA produk yang menggunakan raw_material ini
  -- Ini bisa berat jika produk ribuan, tapi untuk UMKM < 100 produk sangat aman.
  UPDATE products p
  SET hpp_per_pcs = (
    SELECT SUM(rm.cost_per_unit * pr.qty_per_batch) / pr.batch_yield
    FROM product_recipes pr
    JOIN raw_materials rm ON rm.id = pr.raw_material_id
    WHERE pr.product_id = p.id
    GROUP BY pr.batch_yield
  )
  WHERE p.id IN (
    SELECT product_id FROM product_recipes WHERE raw_material_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hpp
AFTER UPDATE OF cost_per_unit ON raw_materials
FOR EACH ROW
EXECUTE FUNCTION recalculate_product_hpp();
```

## 6. Pertimbangan Non-Fungsional

- **Manajemen Konkurensi & Stok Terjepit**: 
  Sistem *TIDAK* memotong stok saat customer klik "Pesan", melainkan saat admin klik "ACC". Keuntungannya: Order abal-abal tidak mengurangi stok. Kekurangannya: Bisa terjadi 2 customer memesan sisa stok 1 secara bersamaan. Penanganan: Admin meng-ACC customer pertama, sistem akan menolak ACC customer kedua karena stok database `0`. Admin bisa mengontak customer kedua (Refund/Ganti Varian). Ini paling manusiawi untuk UMKM.
- **Keamanan Web Publik**: Endpoint `/api/checkout` harus dilindungi dengan Rate Limiting (misal pakai Upstash Redis) untuk mencegah spamming order form.
- **Aksesibilitas / PWA**: Dashboard admin dan Front-end customer didesain Mobile First. Sangat disarankan menambahkan Web Manifest agar bisa di-"Install" (Add to Home Screen) seperti aplikasi native.
- **Order Tracking tanpa Akun**: Disediakan halaman `/(customer)/order-status`. Customer memasukkan `Order Code`. Sistem mengembalikan data terbatas (hanya status pesanan). Data pesanan rinci disembunyikan untuk privasi.

## 7. Daftar Asumsi

1. **Promo Model**: Diasumsikan diskon adalah potongan statis per item (Harga Coret) atau Voucher Keranjang. Tidak ada flash-sale complex time-based yang mematikan server.
2. **Foto Produk**: Admin akan mengunggah gambar produk, tetapi akan di-*crop/resize* di sisi klien (browser admin) sebelum diunggah ke Supabase Storage untuk menghemat bandwidth dan biaya penyimpanan.
3. **Pembayaran**: Murni pencatatan. Ketika order di-ACC, admin berasumsi uang sudah diterima / dicek mutasinya secara manual via m-banking.
4. **Varian Produk**: Diasumsikan sebagai produk terpisah (Produk "Es Gabin Coklat" dan "Es Gabin Keju" adalah 2 ID Produk yang berbeda), bukan 1 Produk dengan SKU Varian. Ini jauh lebih mudah dikelola untuk UMKM (<20 SKU).
5. **Jadwal Toko**: Murni toggle manual oleh admin. Jika admin lupa mematikan saat tidur, order tetap masuk dengan status PENDING (dijawab besok pagi).
