'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatRupiah } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  X,
  CreditCard,
  Send,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  Pencil,
  CheckCircle2,
} from 'lucide-react';

interface CashTransaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: string;
  description: string;
  time: string;
}

// Reset ke 0: transaksi awal kosong
const INITIAL_TRANSACTIONS: CashTransaction[] = [];

const INITIAL_BALANCE = 0;
const STORAGE_KEY = 'lah_gabin_cash_transactions';

export default function AdminCashPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>(INITIAL_TRANSACTIONS);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [addModal, setAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTransactions(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist helper
  const persist = (next: CashTransaction[]) => {
    setTransactions(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

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
    const currentMonth = now.getMonth();

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

    if (editId) {
      const updated = transactions.map((t) =>
        t.id === editId
          ? {
              ...t,
              type: form.type,
              amount: Number(form.amount) || 0,
              category: form.category,
              description: form.description,
            }
          : t
      );
      persist(updated);
      setEditId(null);
      setNotification('Transaksi kas berhasil diperbarui.');
    } else {
      const newTx: CashTransaction = {
        id: crypto.randomUUID(),
        type: form.type,
        amount: Number(form.amount) || 0,
        category: form.category,
        description: form.description,
        time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      persist([newTx, ...transactions]);
      setNotification('Transaksi kas berhasil ditambahkan.');
    }

    setAddModal(false);
    setForm({ type: 'IN', amount: '', category: 'PENJUALAN_POS', description: '' });
    setTimeout(() => setNotification(null), 3000);
  };

  const startEdit = (t: CashTransaction) => {
    setEditId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      description: t.description,
    });
    setAddModal(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan kas ini?')) return;
    const updated = transactions.filter((t) => t.id !== id);
    persist(updated);
    setNotification('Transaksi kas berhasil dihapus.');
    setTimeout(() => setNotification(null), 3000);
  };

  const openAddModal = () => {
    setEditId(null);
    setForm({ type: 'IN', amount: '', category: 'PENJUALAN_POS', description: '' });
    setAddModal(true);
  };

  const setPresetAmount = (amt: number) => {
    setForm({ ...form, amount: String(amt) });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={16} />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Buku Kas & Saldo
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Kelola arus kas, saldo rekening bisnis, dan mutasi pengeluaran Lah Gabin.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary text-xs shadow-md"
        >
          <Plus size={16} /> Catat Mutasi Baru
        </button>
      </div>

      {/* Top Section: My Balance Card + Quick Transfer Form (Bankzai Balance style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Virtual My Balance Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-6 sm:p-7 text-white shadow-xl shadow-blue-500/20">
            {/* Background geometric accents */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[190px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Saldo Kas Bisnis
                  </p>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl mt-1 tracking-tight">
                    {formatRupiah(saldoKas)}
                  </h2>
                </div>
                <div className="w-12 h-8 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-heading font-bold text-xs tracking-wider">
                  LG PAY
                </div>
              </div>

              {/* Progress bar */}
              <div className="my-4">
                <div className="flex justify-between text-[11px] font-medium text-blue-100 mb-1.5">
                  <span>Target Kas Operasional</span>
                  <span className="font-bold">
                    {Math.min(100, Math.round((saldoKas / 5000000) * 100))}%
                  </span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-xs">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((saldoKas / 5000000) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Card details */}
              <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
                <div>
                  <p className="text-[10px] text-blue-200 uppercase font-semibold">Pemilik</p>
                  <p className="font-bold mt-0.5">Lah Gabin Admin</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-200 uppercase font-semibold">Periode</p>
                  <p className="font-bold mt-0.5">2026/09</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-blue-200 uppercase font-semibold">No. Kas</p>
                  <p className="font-mono font-bold mt-0.5">**** 8829</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Breakdown Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bankzai-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Pemasukan
              </p>
              <p className="font-heading font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatRupiah(totalIn)}
              </p>
            </div>
            <div className="bankzai-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Pengeluaran
              </p>
              <p className="font-heading font-extrabold text-sm sm:text-base text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatRupiah(totalOut)}
              </p>
            </div>
            <div className="bankzai-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Arus Bersih
              </p>
              <p
                className={`font-heading font-extrabold text-sm sm:text-base mt-0.5 ${
                  netCashflow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {netCashflow >= 0 ? '+' : ''}
                {formatRupiah(netCashflow)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Cashflow Input Form (Bankzai Quick Transfer style) */}
        <div className="lg:col-span-5 bankzai-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Send size={16} className="text-blue-500" /> Mutasi Cepat
              </h2>
              <span className="text-[11px] font-bold text-neutral-400">Instan</span>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'IN' })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    form.type === 'IN'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  + Kas Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'OUT' })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    form.type === 'OUT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  - Kas Keluar
                </button>
              </div>

              {/* Amount input & presets */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
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
                <div className="flex gap-1.5 mt-2">
                  {[20000, 50000, 100000, 250000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPresetAmount(amt)}
                      className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-neutral-700 dark:text-neutral-300 border border-slate-200/70 dark:border-white/[0.06] transition-colors"
                    >
                      {(amt / 1000).toLocaleString('id-ID')}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Beli bahan keju 1kg"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary text-xs py-2.5 font-bold shadow-md"
              >
                Simpan Transaksi Sekarang
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-2xl gap-1 border border-slate-200/60 dark:border-white/[0.06]">
          <button
            onClick={() => setPeriod('this_month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              period === 'this_month'
                ? 'bg-white dark:bg-[#12141a] text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriod('last_month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              period === 'last_month'
                ? 'bg-white dark:bg-[#12141a] text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Bulan Lalu
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              period === 'all'
                ? 'bg-white dark:bg-[#12141a] text-neutral-900 dark:text-white shadow-xs font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
          <Calendar size={14} />
          {period === 'this_month' && 'Transaksi periode bulan berjalan'}
          {period === 'last_month' && 'Transaksi periode bulan lalu'}
          {period === 'all' && 'Seluruh riwayat mutasi kas'}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bankzai-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
            Riwayat Mutasi Kas
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            {filteredTransactions.length} transaksi
          </span>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-white/[0.06] text-left">
                <th className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Waktu
                </th>
                <th className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Tipe
                </th>
                <th className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Deskripsi & Kategori
                </th>
                <th className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 text-right">
                  Nominal
                </th>
                <th className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-100/70 dark:border-white/[0.04] last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-3 text-xs font-mono text-neutral-400">
                    {t.time}
                  </td>
                  <td className="px-3 py-3">
                    {t.type === 'IN' ? (
                      <span className="bankzai-badge bankzai-badge-completed">
                        <ArrowUpRight size={12} className="mr-1" /> Masuk
                      </span>
                    ) : (
                      <span className="bankzai-badge bankzai-badge-canceled">
                        <ArrowDownRight size={12} className="mr-1" /> Keluar
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-bold text-xs text-neutral-900 dark:text-white">
                      {t.description}
                    </p>
                    <p className="text-[10px] text-neutral-400 uppercase font-semibold mt-0.5">
                      {t.category}
                    </p>
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-heading font-extrabold text-sm tabular-nums ${
                      t.type === 'IN'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {t.type === 'IN' ? '+' : '-'} {formatRupiah(t.amount)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 dark:bg-white/[0.05] dark:hover:bg-blue-950/50 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
                        title="Edit Transaksi"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-white/[0.05] dark:hover:bg-rose-950/50 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-xs text-neutral-400 font-medium"
                  >
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bankzai-card p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
                {editId ? 'Edit Transaksi Kas' : 'Catat Transaksi Kas'}
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.05] text-neutral-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'IN' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    form.type === 'IN'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  + Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'OUT' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    form.type === 'OUT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  - Uang Keluar
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
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

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
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
