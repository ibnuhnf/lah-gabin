# Deploy Guide — Lah Gabin

Next.js 16 + Supabase + Vercel. Estimated time: **30-45 menit** dari nol sampai live.

---

## PRASYARAT

- Akun **Supabase** (supabase.com) — free tier cukup
- Akun **Vercel** (vercel.com) — free tier cukup
- Akun **GitHub** (github.com) — untuk connect repo ke Vercel
- Node.js 18+ terinstall

---

## PHASE 1 — SUPABASE (15 menit)

### 1.1 Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. **Name**: `lah-gabin`
3. **Database Region**: Southeast Asia (`singapore` atau `jakarta`)
4. **Password**: simpan di password manager — ini **Postgres password**, bukan anon key
5. **Organization**: pilih atau buat baru
6. Klik **Create new project** → tunggu ~2 menit provisioning

> **Catatan**: Simpan **Database Password** dari langkah 4 — diperlukan di langkah 1.3.

### 1.2 Ambil Credentials

1. Buka project → **Settings** → **API**
2. Copy 2 nilai ini:

| Field | Simpan di |
|-------|-----------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon/public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

3. Scroll ke **Connection string** → **URI** → copy Postgres URI
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - Simpan — diperlukan untuk langkah 1.3 (pg_dump / direct connection)

### 1.3 Buat Database Schema

**Opsi A — via Supabase SQL Editor (recommended)**

1. Buka project → **SQL Editor** → **New query**
2. Copy seluruh isi file `supabase/schema.sql`
3. **Run** → tunggu sampai muncul `Success` (biasanya 5-10 detik)
4. Buat query baru → copy isi `supabase/seed.sql`
5. **Run** → tunggu `Success`

**Opsi B — via Supabase CLI local**

```bash
npm install -g supabase
supabase login
supabase init
# Edit supabase/config.toml → project-id dari project URL
supabase db push
```

### 1.4 Enable Row Level Security (RLS)

Supabase mengaktifkan RLS secara default. Untuk customer-facing app yang tidak pakai auth, perlu atur policy:

1. Di **SQL Editor**, buat query baru:

```sql
-- izinkan siapa saja baca produk yang aktif
CREATE POLICY "allow_public_products"
ON products FOR SELECT
USING (status != 'inactive');

-- izinkan siapa saja baca store_config
CREATE POLICY "allow_public_store_config"
ON store_config FOR SELECT
USING (true);

-- izinkan siapa saja baca vouchers
CREATE POLICY "allow_public_vouchers"
ON vouchers FOR SELECT
USING (is_active = true);

-- izinkan siapa saja insert orders (tanpa auth)
CREATE POLICY "allow_public_orders_insert"
ON orders FOR INSERT
WITH CHECK (true);

-- izinkan siapa saja baca orders (untuk tracking by invoice code)
CREATE POLICY "allow_public_orders_read"
ON orders FOR SELECT
USING (true);

-- izinkan siapa saja insert order_items
CREATE POLICY "allow_public_order_items_insert"
ON order_items FOR INSERT
WITH CHECK (true);

-- allow public raw_materials read (for recipe/HPP display)
CREATE POLICY "allow_public_raw_materials"
ON raw_materials FOR SELECT
USING (true);

-- allow public recipes read
CREATE POLICY "allow_public_recipes"
ON recipes FOR SELECT
USING (true);
```

2. **Run** semua policy sekaligus

### 1.5 Enable Storage untuk Foto Produk

1. Buka **Storage** di sidebar
2. Klik **New bucket** → name: `products`, public: **Yes**
3. (Opsional) Buat bucket kedua: `receipts` untuk nota pengeluaran

### 1.6 Verifikasi Setup Supabase

Di SQL Editor, jalankan:

```sql
SELECT 
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM raw_materials) as materials,
  (SELECT COUNT(*) FROM vouchers) as vouchers,
  (SELECT is_open FROM store_config LIMIT 1) as store_open;
```

Harus return: `products: 8`, `materials: 10`, `vouchers: 1`, `store_open: true`

---

## PHASE 2 — GITHUB (5 menit)

### 2.1 Inisialisasi Git Repo (jika belum)

```bash
cd lah-gabin
git init
git add .
git commit -m "feat: initial Lah Gabin app"
```

### 2.2 Push ke GitHub

1. Buat repo baru di GitHub: **lah-gabin**
2. Hubungkan dan push:

```bash
git remote add origin https://github.com/[username]/lah-gabin.git
git branch -M main
git push -u origin main
```

---

## PHASE 3 — VERCEL (10 menit)

### 3.1 Connect Repo ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Pilih repo **lah-gabin** dari daftar GitHub
3. Klik **Import**

### 3.2 Konfigurasi Environment Variables

Sebelum deploy, perlu set env vars:

1. Di halaman **Configure Project**:
   - Expand **Environment Variables**
   - Tambahkan 3 variabel:

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project-id].supabase.co` | dari langkah 1.2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[anon-key]` | dari langkah 1.2 |
| `NEXT_PUBLIC_ADMIN_WA` | `6282121498255` | nomor WA admin (format international, tanpa +) |

2. Klik **Add** untuk masing-masing

### 3.3 Deploy

1. Framework Preset: **Next.js** (deteksi otomatis)
2. Root Directory: `.` (biarkan default)
3. Build Command: `npm run build` (default)
4. Output Directory: `.next` (default)
5. Klik **Deploy**

Tunggu ~2-3 menit. Vercel akan otomatis install dependencies dan build.

### 3.4 Custom Domain (Opsional)

1. Buka project → **Settings** → **Domains**
2. Tambahkan domain (mis. `lahgabin.id`)
3. Ikuti instruksi DNS (A record atau CNAME)
4. Tunggu propagasi ~5-30 menit

---

## PHASE 4 — VERIFIKASI (5 menit)

### 4.1 Test Customer Web

Buka `https://[project-url].vercel.app`:

- [ ] Landing page muncul dengan hero dan katalog produk
- [ ] Badge "Buka" / "Tutup" terlihat
- [ ] Klik produk → terlihat harga dan tombol "Pesan"
- [ ] Tambahkan ke keranjang → checkout
- [ ] Submit order → invoice PDF ter-download

### 4.2 Test Admin Dashboard

Buka `https://[project-url].vercel.app/admin`:

- [ ] Halaman login admin muncul
- [ ] Login dengan `admin@lahgabin.id` / `admin123` (default seed)
- [ ] Dashboard menampilkan KPI cards
- [ ] Navigasi sidebar berfungsi
- [ ] Halaman pesanan (order approval queue) terlihat

### 4.3 Test Order Flow End-to-End

1. Customer buat order di halaman customer → dapat invoice code (mis. `LG-20260903-0001`)
2. Admin login → buka `/admin/pesanan`
3. Order `LG-20260903-0001` muncul di queue dengan status **PENDING_APPROVAL**
4. Klik **Terima** → status berubah, stok berkurang
5. Customer cek `/pemesanan/[invoice-code]` → status sudah **DITERIMA_PROSES**

---

## PHASE 5 — KONFIGURASI AWAL ADMIN (setelah deploy)

### 5.1 Ganti Password Admin Default

1. Login ke `/admin` dengan `admin@lahgabin.id` / `admin123`
2. Buka **Settings** atau langsung ke database:
3. Di Supabase SQL Editor:

```sql
UPDATE users 
SET password_hash = '$2a$10$...'  -- bcrypt hash di sini
WHERE email = 'admin@lahgabin.id';
-- Atau via Supabase Auth Dashboard → Authentication → Users
```

### 5.2 Update Nomor WhatsApp Admin

1. Di `/admin` → **Pengaturan Toko** (atau via Supabase SQL):
```sql
UPDATE store_config SET wa_number = '62XXXXXXXXXX';
```

### 5.3 Update Info Pembayaran

```sql
UPDATE store_config SET 
  bank_account_info = 'BCA 123-456-789 a/n Nama Toko',
  qris_image_url = 'https://[project].supabase.co/storage/v1/object/public/receipts/qris.png';
```

Upload file QRIS ke Supabase Storage bucket `receipts` sebelum update URL.

### 5.4 Update Logo Brand (Opsional)

Upload logo ke Supabase Storage bucket `products` atau `receipts`, lalu update di komponen Navbar dan PDF invoice.

---

## TROUBLESHOOTING

### Error: `NEXT_PUBLIC_SUPABASE_URL is not defined`

Env var belum di-set di Vercel. Buka Vercel Dashboard → Project → **Settings** → **Environment Variables** → add ulang.

### Error: `relation "products" does not exist`

Schema SQL belum di-run. Buka Supabase SQL Editor → run `schema.sql` → refresh page.

### Error: RLS denied access

Policy RLS belum dibuat. Run script policy di langkah 1.4.

### Error: Invoice PDF tidak ter-download

Browser memblokir auto-download. jsPDF sudah fallback ke blob URL + manual download button — customer bisa klik tombol "Download Invoice".

### Error: `pnpm: command not found` saat dev

```bash
npm install -g pnpm
# atau
corepack enable
```

### Build gagal di Vercel tapi `npm run build` lokal berhasil

Pastikan semua env vars yang diperlukan (termasuk yang prefixed `NEXT_PUBLIC_`) sudah di-set di Vercel Dashboard, bukan hanya di `.env.local`.

### Error: `Invalid ARN` saat connect Supabase Storage

Pastikan bucket dibuat di region yang sama dengan project. Cek URL Supabase Storage bucket: harus match format `https://[id].supabase.co/storage/v1/object/public/[bucket]/[file]`.

---

## LOCAL DEVELOPMENT

Clone repo ke mesin lain:

```bash
git clone https://github.com/[username]/lah-gabin.git
cd lah-gabin

# Salin env vars
cp .env.local.example .env.local
# Edit .env.local → isi credentials dari Supabase

# Install & run
npm install
npm run dev
```

---

## STRUKTUR FILE PENTING

```
lah-gabin/
├── .env.local.example        ← template env vars (commit)
├── .env.local                ← credentials lokal (DI-GITIGNORE)
├── supabase/
│   ├── schema.sql            ← DDL: semua tabel, trigger, stored procedure
│   └── seed.sql              ← data awal: produk, bahan baku, voucher
├── src/
│   ├── lib/
│   │   ├── supabase.ts       ← Supabase client singleton
│   │   ├── orders.ts         ← create order, validate voucher, order actions
│   │   ├── invoice.ts        ← jsPDF invoice generation
│   │   └── whatsapp.ts       ← WhatsApp URL builder
│   ├── contexts/
│   │   ├── CartContext.tsx   ← cart state (localStorage persist)
│   │   └── StoreContext.tsx  ← store status polling
│   ├── app/(customer)/       ← halaman customer (tanpa auth)
│   ├── app/admin/            ← halaman admin (dengan auth)
│   └── app/api/             ← API routes jika perlu
└── vercel.json              ← Vercel config (optional, Next.js auto-detect)
```

---

## UPDATE DEPLOYMENT

Setiap push ke branch `main` → Vercel auto-redeploy.

Untuk update schema database (setelah edit `schema.sql`):

```bash
# Option 1: Manual via Supabase Dashboard → SQL Editor
# Copy-paste schema.sql yang sudah diupdate → Run

# Option 2: Via Supabase CLI
supabase db push
```

---

## KEAMANAN

- [ ] Ganti password admin default setelah first deploy
- [ ] Pastikan RLS policy sudah di-setup (langkah 1.4)
- [ ] Jangan pernah commit `.env.local` ke Git
- [ ] Untuk production: enable **Build Isolation** di Vercel
- [ ] Untuk production: setup **Branch Protection** di GitHub
