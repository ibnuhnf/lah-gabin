'use client';

import { useEffect, useState } from 'react';
import { Plus, Boxes, X, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface StockMutation {
  id: string;
  item: string;
  type: string;
  qty: number;
  before: number;
  after: number;
  ref: string | null;
  notes: string;
  time: string;
}

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

const TYPE_OPTIONS = [
  { value: 'MASUK_PEMBELIAN', label: 'Masuk Pembelian' },
  { value: 'MASUK_PRODUKSI', label: 'Masuk Produksi' },
  { value: 'KELUAR_PENJUALAN', label: 'Keluar Penjualan' },
  { value: 'WASTE', label: 'Waste / Buang' },
  { value: 'PENYESUAIAN', label: 'Penyesuaian' },
];

const TYPE_BADGE: Record<string, string> = {
  MASUK_PEMBELIAN: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60',
  MASUK_PRODUKSI: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60',
  KELUAR_PENJUALAN: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
  WASTE: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60',
  PENYESUAIAN: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60',
};

export default function AdminStockPage() {
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);

  // Form state
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('MASUK_PEMBELIAN');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    // Load products from Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, name, stock_quantity')
          .order('name');
        if (!prodErr && prodData) setProducts(prodData);
      } catch {}
    } else {
      try {
        const local = localStorage.getItem('lah_gabin_admin_products');
        if (local) {
          const parsed = JSON.parse(local);
          setProducts(
            parsed.map((p: { id: string; name: string; stock_quantity: number }) => ({
              id: p.id,
              name: p.name,
              stock_quantity: p.stock_quantity,
            }))
          );
        }
      } catch {}
    }

    // Load stock_mutations from Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: mutData, error: mutErr } = await supabase
          .from('stock_mutations')
          .select('*')
          .order('created_at', { ascending: false });
        if (!mutErr && mutData) {
          setMutations(
            mutData.map((m: Record<string, unknown>) => ({
              id: m.id as string,
              item: (m.product_id as string) || '-',
              type: m.mutation_type as string,
              qty: m.quantity_change as number,
              before: m.stock_before as number,
              after: m.stock_after as number,
              ref: (m.reference_id as string) || null,
              notes: (m.notes as string) || '-',
              time: m.created_at as string,
            }))
          );
          return;
        }
      } catch {}
    }

    // Fallback to localStorage
    try {
      const local = localStorage.getItem('lah_gabin_stock_mutations');
      if (local) setMutations(JSON.parse(local));
    } catch {}
  }

  function getDeltaForType(t: string, q: number): number {
    if (t === 'MASUK_PEMBELIAN' || t === 'MASUK_PRODUKSI' || t === 'PENYESUAIAN') return Math.abs(q);
    return -Math.abs(q);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      setMessage('Pilih produk terlebih dahulu');
      return;
    }
    const numQty = Math.abs(Number(qty));
    if (!numQty || numQty <= 0) {
      setMessage('Jumlah harus lebih dari 0');
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      setMessage('Produk tidak ditemukan');
      return;
    }

    setSaving(true);
    const delta = getDeltaForType(type, numQty);
    const before = product.stock_quantity;
    const after = Math.max(0, before + delta);
    const now = new Date().toISOString();

    const mutation: StockMutation = {
      id: crypto.randomUUID(),
      item: product.name,
      type,
      qty: delta,
      before,
      after,
      ref: null,
      notes: notes || '-',
      time: now,
    };

    try {
      // 1. Update product stock
      if (isSupabaseConfigured()) {
        await supabase
          .from('products')
          .update({ stock_quantity: after, updated_at: now })
          .eq('id', productId);

        await supabase.from('stock_mutations').insert({
          id: mutation.id,
          product_id: productId,
          mutation_type: type,
          quantity_change: delta,
          stock_before: before,
          stock_after: after,
          reference_id: null,
          notes: notes || '-',
          created_at: now,
        });
      }

      // 2. Always update local cache too
      try {
        const localProd = localStorage.getItem('lah_gabin_admin_products');
        if (localProd) {
          const parsed = JSON.parse(localProd);
          const newList = parsed.map((p: Product) =>
            p.id === productId ? { ...p, stock_quantity: after } : p
          );
          localStorage.setItem('lah_gabin_admin_products', JSON.stringify(newList));
        }
        const newMutations = [mutation, ...mutations];
        localStorage.setItem('lah_gabin_stock_mutations', JSON.stringify(newMutations));
        setMutations(newMutations);
      } catch {}

      setMessage(`Mutasi ${type} ${numQty} pcs berhasil dicatat!`);
      setTimeout(() => setMessage(null), 2500);
      setOpen(false);
      setProductId('');
      setQty('');
      setNotes('');
      await loadAll();
    } catch (err) {
      console.error(err);
      setMessage('Gagal menyimpan mutasi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Mutasi Stok
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Audit trail pergerakan stok produk Lah Gabin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary text-xs shadow-md"
        >
          <Plus size={16} /> Catat Penyesuaian
        </button>
      </div>

      {message && (
        <div className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          {message}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                <th className="text-left px-4 py-3.5 font-semibold">Waktu</th>
                <th className="text-left px-4 py-3.5 font-semibold">Item</th>
                <th className="text-left px-4 py-3.5 font-semibold">Tipe Mutasi</th>
                <th className="text-right px-4 py-3.5 font-semibold">Perubahan</th>
                <th className="text-right px-4 py-3.5 font-semibold">Sebelum</th>
                <th className="text-right px-4 py-3.5 font-semibold">Sesudah</th>
                <th className="text-left px-4 py-3.5 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {mutations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-neutral-400">
                    Belum ada mutasi stok. Klik tombol <b>Catat Penyesuaian</b> untuk menambah.
                  </td>
                </tr>
              ) : (
                mutations.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="px-4 py-3.5 text-neutral-400 font-mono">
                      {new Date(m.time).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-neutral-900 dark:text-white">{m.item}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[m.type] || 'bg-neutral-100'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold font-heading text-sm ${m.qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {m.qty > 0 ? `+${m.qty}` : m.qty}
                    </td>
                    <td className="px-4 py-3.5 text-right text-neutral-400">{m.before}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-neutral-900 dark:text-white">{m.after}</td>
                    <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400">{m.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Mutasi */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="font-heading font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Boxes size={18} /> Catat Mutasi Stok
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Produk
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="input-field mt-1 text-xs"
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stok: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Tipe Mutasi
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field mt-1 text-xs"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Jumlah (pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="input-field mt-1 text-xs"
                  placeholder="contoh: 10"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Catatan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field mt-1 text-xs"
                  rows={2}
                  placeholder="Opsional..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 text-xs"
                >
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
