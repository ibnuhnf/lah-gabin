'use client';

import { useState, useMemo } from 'react';
import { formatRupiah } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Plus, Calendar, X, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface CashTransaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: string;
  description: string;
  time: string; // ISO or YYYY-MM-DD HH:mm
}

const INITIAL_TRANSACTIONS: CashTransaction[] = [
  { id: '1', type: 'IN', amount: 35000, category: 'PENJUALAN_ONLINE', description: 'Penjualan LG-20260902-A1B2', time: '2026-09-02 10:35' },
  { id: '2', type: 'IN', amount: 22000, category: 'PENJUALAN_POS', description: 'Transaksi Kasir Walk-in', time: '2026-09-02 09:15' },
  { id: '3', type: 'OUT', amount: 350000, category: 'BAHAN_BAKU', description: 'Pembelian bahan baku mingguan', time: '2026-09-01 16:00' },
  { id: '4', type: 'IN', amount: 18000, category: 'PENJUALAN_ONLINE', description: 'Penjualan LG-20260902-C3D4', time: '2026-09-01 14:45' },
  { id: '5', type: 'OUT', amount: 85000, category: 'KEMASAN', description: 'Pembelian plastik klip + label', time: '2026-09-01 12:30' },
  { id: '6', type: 'IN', amount: 550000, category: 'PENJUALAN_ONLINE', description: 'Total Penjualan Online Agustus', time: '2026-08-28 20:00' },
  { id: '7', type: 'OUT', amount: 200000, category: 'OPERASIONAL', description: 'Biaya Gas & Listrik Agustus', time: '2026-08-25 10:00' },
  { id: '8', type: 'IN', amount: 120000, category: 'PENJUALAN_POS', description: 'Event CFD Agustus', time: '2026-08-15 11:30' },
];

const INITIAL_BALANCE = 1850000;

export default function AdminCashPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>(INITIAL_TRANSACTIONS);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [addModal, setAddModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    type: 'IN' as 'IN' | 'OUT',
    amount: '',
    category: 'PENJUALAN_POS',
    description: '',
  });

  // Date filtering logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return transactions.filter((t) => {
      if (period === 'all') return true;

      const tDate = new Date(t.time.replace(' ', 'T'));
      if (isNaN(tDate.getTime())) return true;

      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();

      if (period === 'this_month') {
        return tYear === currentYear && tMonth === currentMonth;
      }

      if (period === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return tYear === lastMonthYear && tMonth === lastMonth;
      }

      return true;
    });
  }, [transactions, period]);

  const totalIn = filteredTransactions
    .filter((t) => t.type === 'IN')
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = filteredTransactions
    .filter((t) => t.type === 'OUT')
    .reduce((s, t) => s + t.amount, 0);

  const netCashflow = totalIn - totalOut;
  const saldoKas = INITIAL_BALANCE + netCashflow;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    const newTx: CashTransaction = {
      id: crypto.randomUUID(),
      type: form.type,
      amount: Number(form.amount) || 0,
      category: form.category,
      description: form.description,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setTransactions([newTx, ...transactions]);
    setAddModal(false);
    setForm({ type: 'IN', amount: '', category: 'PENJUALAN_POS', description: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Buku Kas
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Pencatatan arus kas masuk, keluar, dan saldo operasional Lah Gabin.
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="btn-primary text-sm shadow-md"
        >
          <Plus size={18} /> Catat Mutasi Kas
        </button>
      </div>

      {/* Period Selector (iOS Segmented Control) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-neutral-200/70 dark:bg-neutral-800/80 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setPeriod('this_month')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95 ${
              period === 'this_month'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriod('last_month')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95 ${
              period === 'last_month'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Bulan Sebelumnya
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95 ${
              period === 'all'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Keseluruhan
          </button>
        </div>

        <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
          <Calendar size={14} />
          {period === 'this_month' && 'Menampilkan transaksi periode bulan berjalan'}
          {period === 'last_month' && 'Menampilkan transaksi periode 1 bulan lalu'}
          {period === 'all' && 'Menampilkan seluruh riwayat transaksi'}
        </div>
      </div>

      {/* KPI Cards (iOS Glass Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card border border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Total Pemasukan</span>
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalIn)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Dari order online & penjualan POS</p>
        </div>

        <div className="kpi-card border border-rose-500/20 bg-gradient-to-br from-white to-rose-50/30 dark:from-neutral-900 dark:to-rose-950/20">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Total Pengeluaran</span>
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-rose-600 dark:text-rose-400">
            {formatRupiah(totalOut)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Bahan baku, operasional & kemasan</p>
        </div>

        <div className="kpi-card border-2 border-accent-500/40 bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-900 dark:to-orange-950/20">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="font-bold text-accent-600">Saldo Kas Tersedia</span>
            <div className="w-6 h-6 rounded-full bg-accent-500/20 text-accent-500 flex items-center justify-center">
              <Wallet size={14} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-neutral-900 dark:text-white">
            {formatRupiah(saldoKas)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Saldo awal + Net Cashflow</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">Waktu</th>
                <th className="text-center px-4 py-3.5 font-semibold">Tipe</th>
                <th className="text-left px-4 py-3.5 font-semibold">Kategori & Deskripsi</th>
                <th className="text-right px-5 py-3.5 font-semibold">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="table-row">
                  <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap font-mono">
                    {t.time}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {t.type === 'IN' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                        <ArrowUpRight size={13} /> Masuk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                        <ArrowDownRight size={13} /> Keluar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-neutral-900 dark:text-white">{t.description}</p>
                    <p className="text-xs text-neutral-400">{t.category}</p>
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-bold font-heading text-base ${
                      t.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {t.type === 'IN' ? '+' : '-'} {formatRupiah(t.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-neutral-400">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-lg text-neutral-900 dark:text-white">
                Catat Transaksi Kas
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center hover:bg-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'IN' })}
                  className={`py-2 rounded-2xl text-xs font-bold border transition-all ${
                    form.type === 'IN'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
                  }`}
                >
                  + Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'OUT' })}
                  className={`py-2 rounded-2xl text-xs font-bold border transition-all ${
                    form.type === 'OUT'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
                  }`}
                >
                  - Uang Keluar
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  <option value="PENJUALAN_POS">Penjualan Kasir / POS</option>
                  <option value="PENJUALAN_ONLINE">Penjualan Online</option>
                  <option value="BAHAN_BAKU">Pembelian Bahan Baku</option>
                  <option value="KEMASAN">Kemasan & Plastik</option>
                  <option value="OPERASIONAL">Operasional (Gas, Es, Listrik)</option>
                  <option value="LAINNYA">Lain-lain</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli es batu kristal 2 bal"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary text-xs font-semibold shadow-md"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
