'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import type { Voucher } from '@/types';

const MOCK_VOUCHERS: Voucher[] = [
  { id: '1', code: 'PROMOHEMAT', discount_type: 'FIXED', discount_value: 5000, min_order_amount: 25000, max_discount_amount: null, quota_total: 50, quota_used: 12, start_date: '2026-09-01', end_date: '2026-09-30', is_active: true },
  { id: '2', code: 'GABINSERU', discount_type: 'PERCENTAGE', discount_value: 10, min_order_amount: 30000, max_discount_amount: 10000, quota_total: 100, quota_used: 45, start_date: '2026-09-01', end_date: '2026-09-15', is_active: true },
  { id: '3', code: 'EXPIRED10', discount_type: 'PERCENTAGE', discount_value: 10, min_order_amount: 20000, max_discount_amount: 5000, quota_total: 20, quota_used: 20, start_date: '2026-08-01', end_date: '2026-08-31', is_active: false },
];

const STORAGE_KEY = 'lah_gabin_vouchers';

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>(MOCK_VOUCHERS);
  const [deleteModal, setDeleteModal] = useState<Voucher | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setVouchers(JSON.parse(saved));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_VOUCHERS));
      }
    } catch {}
  }, []);

  const persist = (next: Voucher[]) => {
    setVouchers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const toggleActive = (id: string) => {
    persist(vouchers.map((v) => (v.id === id ? { ...v, is_active: !v.is_active } : v)));
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    persist(vouchers.filter((v) => v.id !== deleteModal.id));
    setDeleteModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Tag size={24} className="text-accent-500" /> Voucher & Diskon
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Kelola kupon diskon untuk pesanan pelanggan.</p>
        </div>
        <button className="btn-primary text-xs shadow-md">
          <Plus size={16} /> Buat Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.map((v) => (
          <div key={v.id} className="card p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono font-extrabold text-base bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  {v.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleActive(v.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                    {v.is_active ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">Aktif</span>
                    ) : (
                      <span className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">Nonaktif</span>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteModal(v)}
                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-rose-100 dark:bg-neutral-800 dark:hover:bg-rose-950/50 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
                    title="Hapus Voucher"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="font-heading font-extrabold text-xl text-accent-500 mt-3">
                {v.discount_type === 'FIXED'
                  ? `Potongan ${formatRupiah(v.discount_value)}`
                  : `Diskon ${v.discount_value}%`}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Min. Pembelian: <strong className="text-neutral-800 dark:text-neutral-200">{formatRupiah(v.min_order_amount)}</strong>
              </p>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Kuota Terpakai:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{v.quota_used} / {v.quota_total}</span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent-500 h-full rounded-full"
                  style={{ width: `${(v.quota_used / v.quota_total) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 pt-1">
                Berlaku: {v.start_date} s.d. {v.end_date}
              </p>
            </div>
          </div>
        ))}
      </div>

      {vouchers.length === 0 && (
        <div className="card p-10 text-center text-xs text-neutral-400 font-medium">
          Belum ada voucher.
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-900 dark:text-white mb-1">
              Hapus Voucher?
            </h3>
            <p className="text-xs text-neutral-500 mb-4 font-medium leading-relaxed">
              Voucher <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{deleteModal.code}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
