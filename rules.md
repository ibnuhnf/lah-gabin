# Rules — Lah Gabin

## Identitas Proyek

- **Nama**: Lah Gabin — Sistem manajemen order & inventori untuk UMKM makanan/minuman
- **Target User**: Admin/Kasir UMKM (backend) dan Customer (frontend publik)
- **Bahasa UI**: Indonesia. Semua label, pesan error, dan teks UI wajib Bahasa Indonesia
- **Zona Waktu**: `Asia/Jakarta` (WIB). Semua tampilan tanggal/waktu gunakan WIB

## Tech Stack (WAJIB)

- **Framework**: Next.js 14+ App Router (TypeScript)
- **Database & Auth & Storage**: Supabase (PostgreSQL) — gunakan Supabase JS Client langsung, TANPA ORM (Prisma/Drizzle/dll)
- **Styling**: Tailwind CSS
- **PDF**: jsPDF + jspdf-autotable (client-side only)
- **Hosting**: Vercel
- **State Management**: Zustand (cart customer di client)
- Jangan tambahkan library baru tanpa justifikasi eksplisit. Stdlib/platform-native dulu

## Arsitektur & Routing

- Monorepo Next.js tunggal
- Route publik customer: `/(customer)/*`
- Route admin/kasir: `/admin/*` — dilindungi middleware auth Supabase
- Gunakan Server Actions untuk mutasi data (checkout, ACC order, CRUD produk). Hindari membuat API route terpisah kecuali untuk webhook/external integration
- Server Components by default. Client Components (`'use client'`) hanya jika butuh interaktivitas browser (form, state, PDF gen)

## Database & Data Integrity

- Ikuti skema di `arsitektur-sistem.md` sebagai sumber kebenaran. Jangan ubah nama tabel/kolom/enum tanpa diskusi
- UUID untuk semua primary key
- JSONB untuk snapshot data di transaksi (harga, HPP di `order_items`)
- Soft delete (`deleted_at`) — jangan `DELETE` record master (users, products, raw_materials)
- Operasi kritis (ACC order, potong stok) WAJIB via Supabase RPC/Stored Procedure untuk atomicity. Jangan lakukan pengurangan stok di application layer
- `store_config` hanya 1 row — enforced via unique index

## Order Flow (State Machine)

```
PENDING_APPROVAL → DITERIMA_PROSES → DIPROSES → SELESAI
                 ↘ DIBATALKAN (dari status manapun sebelum SELESAI)
```

- Stok dipotong saat admin ACC, BUKAN saat customer checkout
- Stok dikembalikan jika order dibatalkan setelah ACC
- `SELESAI` dan `DIBATALKAN` adalah status final — tidak bisa transisi lagi
- Snapshot harga (`price_at_order`) dan HPP (`hpp_at_order`) disimpan di `order_items` saat order dibuat

## Keamanan

- Jangan expose secret/key di client code atau commit ke repo
- Rate limiting di endpoint publik (`/api/checkout`)
- Validasi input di server-side — jangan percaya data dari client
- RLS (Row Level Security) Supabase aktif di tabel yang diakses dari client
- Endpoint admin wajib cek session/role sebelum eksekusi

## Kode & Konvensi

- TypeScript strict mode
- Penamaan file: `kebab-case` untuk file/folder, `PascalCase` untuk komponen React
- Jangan tambahkan komentar kecuali diminta
- Mobile-first design — semua UI harus responsif
- Format mata uang: `Rp` + `toLocaleString('id-ID')` — contoh: `Rp 25.000`
- Format kode order: `LG-YYYYMMDD-XXXX`

## Bisnis Logic Penting

- **HPP**: Dihitung otomatis dari resep (`product_recipes` × `raw_materials.cost_per_unit` / `batch_yield`). Update otomatis via DB trigger saat harga bahan baku berubah
- **Diskon produk**: Harga coret per item (`discount_price` + rentang tanggal). Bukan flash-sale complex
- **Voucher**: Flat atau Percentage dengan `max_discount_amount` dan `quota_total`. Validasi konkurensi di server
- **Pembayaran**: Pencatatan manual oleh admin (CASH/TRANSFER/QRIS). Bukan payment gateway
- **Varian produk**: Setiap varian = produk terpisah (ID berbeda). Bukan SKU varian di bawah 1 produk
- **Toko buka/tutup**: Toggle manual `is_open` di `store_config`

## Larangan

- Jangan gunakan Prisma, Drizzle, atau ORM lain
- Jangan buat payment gateway integration
- Jangan implementasi sistem login/akun untuk customer
- Jangan ubah flow stok (potong di ACC, bukan di checkout)
- Jangan hardcode nomor WA admin — ambil dari `store_config.wa_number`
- Jangan render PDF di server — PDF generation selalu client-side via jsPDF
