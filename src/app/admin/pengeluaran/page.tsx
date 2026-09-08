'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Receipt,
  Pencil,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  description: string;
  created_at?: string;
}

const CATEGORIES = [
  'Bahan Baku',
  'Kemasan / Packaging',
  'Operasional (Gas / Listrik / Air)',
  'Transportasi / Logistik',
  'Marketing / Iklan',
  'Gaji / Upah',
  'Lain-lain',
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: '1', date: '2026-09-01', category: 'Bahan Baku', amount: 350000, description: 'Beli biskuit gabin, susu, keju (mingguan)' },
  { id: '2', date: '2026-09-01', category: 'Kemasan / Packaging', amount: 85000, description: 'Plastik klip 500 pcs + stiker label' },
  { id: '3', date: '2026-08-30', category: 'Operasional (Gas / Listrik / Air)', amount: 250000, description: 'Token listrik freezer + isi gas' },
  { id: '4', date: '2026-08-29', category: 'Transportasi / Logistik', amount: 45000, description: 'Ongkir kirim bahan baku' },
  { id: '5', date: '2026-08-25', category: 'Marketing / Iklan', amount: 100000, description: 'Boost IG story promo opening 7 hari' },
];

const STORAGE_KEY = 'lah_gabin_admin_expenses';

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0],
    amount: '',
    description: '',
  });

  // Load from Supabase + localStorage
  useEffect(() => {
    async function loadExpenses() {
      let remoteData: ExpenseItem[] = [];
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });

          if (!error && data && data.length > 0) {
            remoteData = data.map((d: Record<string, unknown>) => ({
              id: String(d.id),
              date: String(d.expense_date || d.created_at || '').slice(0, 10),
              category: String(d.category || CATEGORIES[0]),
              amount: Number(d.amount) || 0,
              description: String(d.description || '-'),
              created_at: String(d.created_at || ''),
            }));
          }
        } catch (err) {
          console.warn('Gagal load expenses dari Supabase:', err);
        }
      }

      let localData: ExpenseItem[] = [];
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          localData = JSON.parse(saved);
        } else if (remoteData.length === 0) {
          localData = INITIAL_EXPENSES;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EXPENSES));
        }
      } catch {}

      // Merge and dedupe
      const seen = new Set(remoteData.map((e) => e.id));
      const merged = [...remoteData];
      for (const loc of localData) {
        if (!seen.has(loc.id)) {
          merged.push(loc);
        }
      }
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(merged);

      // Backfill: pastikan semua expense yang ada tercatat di Buku Kas (jika belum ada)
      try {
        const cashList: Array<{
          id: string;
          type: 'IN' | 'OUT';
          amount: number;
          category: string;
          description: string;
          time: string;
          linked_expense_id?: string;
        }> = JSON.parse(localStorage.getItem('lah_gabin_cash_transactions') || '[]');

        const existingLinkedIds = new Set(
          cashList.filter((c) => c.linked_expense_id).map((c) => c.linked_expense_id)
        );

        const categoryMap: Record<string, string> = {
          'Bahan Baku': 'BAHAN_BAKU',
          'Kemasan / Packaging': 'KEMASAN',
          'Operasional (Gas / Listrik / Air)': 'OPERASIONAL',
          'Transportasi / Logistik': 'OPERASIONAL',
          'Marketing / Iklan': 'LAINNYA',
          'Gaji / Upah': 'LAINNYA',
          'Lain-lain': 'LAINNYA',
        };

        let added = false;
        for (const exp of merged) {
          if (!existingLinkedIds.has(exp.id)) {
            cashList.push({
              id: crypto.randomUUID(),
              type: 'OUT',
              amount: exp.amount,
              category: categoryMap[exp.category] || 'LAINNYA',
              description: `${exp.category}: ${exp.description}`,
              time: `${exp.date} 00:00`,
              linked_expense_id: exp.id,
            });
            added = true;
          }
        }
        if (added) {
          localStorage.setItem('lah_gabin_cash_transactions', JSON.stringify(cashList));
        }
      } catch {}
    }

    loadExpenses();

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setExpenses(JSON.parse(e.newValue));
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const persistExpenses = (newList: ExpenseItem[]) => {
    setExpenses(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  };

  // Bridge ke Buku Kas: setiap create/update/delete expense auto-create/update/delete OUT cash transaction
  const syncCashTransaction = (
    action: 'create' | 'update' | 'delete',
    expense: ExpenseItem
  ) => {
    try {
      const cashList: Array<{
        id: string;
        type: 'IN' | 'OUT';
        amount: number;
        category: string;
        description: string;
        time: string;
        linked_expense_id?: string;
      }> = JSON.parse(localStorage.getItem('lah_gabin_cash_transactions') || '[]');

      const categoryMap: Record<string, string> = {
        'Bahan Baku': 'BAHAN_BAKU',
        'Kemasan / Packaging': 'KEMASAN',
        'Operasional (Gas / Listrik / Air)': 'OPERASIONAL',
        'Transportasi / Logistik': 'OPERASIONAL',
        'Marketing / Iklan': 'LAINNYA',
        'Gaji / Upah': 'LAINNYA',
        'Lain-lain': 'LAINNYA',
      };
      const mappedCategory = categoryMap[expense.category] || 'LAINNYA';

      const idx = cashList.findIndex((c) => c.linked_expense_id === expense.id);

      if (action === 'delete') {
        if (idx >= 0) {
          cashList.splice(idx, 1);
          localStorage.setItem('lah_gabin_cash_transactions', JSON.stringify(cashList));
        }
        return;
      }

      // create or update
      const tx = {
        id: idx >= 0 ? cashList[idx].id : crypto.randomUUID(),
        type: 'OUT' as const,
        amount: expense.amount,
        category: mappedCategory,
        description: `${expense.category}: ${expense.description}`,
        time: `${expense.date} 00:00`,
        linked_expense_id: expense.id,
      };

      if (idx >= 0) {
        cashList[idx] = tx;
      } else {
        cashList.unshift(tx);
      }
      localStorage.setItem('lah_gabin_cash_transactions', JSON.stringify(cashList));
    } catch {}
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
      category: CATEGORIES[0],
      amount: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: ExpenseItem) => {
    setEditItem(item);
    setForm({
      date: item.date,
      category: item.category,
      amount: String(item.amount),
      description: item.description,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(form.amount);
    if (!form.amount || numAmount <= 0 || !form.description.trim()) {
      showNotify('Harap isi nominal dan deskripsi dengan benar.');
      return;
    }

    const now = new Date().toISOString();

    if (editItem) {
      // Update
      const updatedList = expenses.map((item) =>
        item.id === editItem.id
          ? {
              ...item,
              date: form.date,
              category: form.category,
              amount: numAmount,
              description: form.description.trim(),
            }
          : item
      );
      persistExpenses(updatedList);

      if (isSupabaseConfigured()) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editItem.id);
          if (isUuid) {
            await supabase
              .from('expenses')
              .update({
                expense_date: form.date,
                amount: numAmount,
                description: form.description.trim(),
              })
              .eq('id', editItem.id);
          }
        } catch {}
      }

      // Sync ke Buku Kas: update OUT transaction yang terkait
      syncCashTransaction('update', {
        id: editItem.id,
        date: form.date,
        category: form.category,
        amount: numAmount,
        description: form.description.trim(),
        created_at: editItem.created_at,
      });

      showNotify('Pengeluaran berhasil diperbarui.');
    } else {
      // Create new
      const newId = crypto.randomUUID();
      const newItem: ExpenseItem = {
        id: newId,
        date: form.date,
        category: form.category,
        amount: numAmount,
        description: form.description.trim(),
        created_at: now,
      };

      const updatedList = [newItem, ...expenses];
      persistExpenses(updatedList);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('expenses').insert({
            id: newId,
            expense_date: form.date,
            amount: numAmount,
            description: form.description.trim(),
            created_at: now,
          });
        } catch {}
      }

      // Sync ke Buku Kas: auto-create OUT transaction
      syncCashTransaction('create', newItem);

      showNotify('Pengeluaran baru berhasil dicatat.');
    }

    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    // Cari item dulu untuk sync sebelum dihapus
    const deletedItem = expenses.find((e) => e.id === id);
    const updatedList = expenses.filter((e) => e.id !== id);
    persistExpenses(updatedList);

    // Sync ke Buku Kas: hapus OUT transaction terkait
    if (deletedItem) {
      syncCashTransaction('delete', deletedItem);
    }

    if (isSupabaseConfigured()) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('expenses').delete().eq('id', id);
        }
      } catch {}
    }

    setDeleteId(null);
    showNotify('Pengeluaran telah dihapus.');
  };

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchMonth = !monthFilter || item.date.startsWith(monthFilter);
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchQuery =
        !searchQuery ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMonth && matchCat && matchQuery;
    });
  }, [expenses, monthFilter, categoryFilter, searchQuery]);

  // Statistics
  const totalAmountFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0);

  // Group by category for badge insights
  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0] : null;
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:items-center">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Receipt size={26} className="text-rose-500" /> Pengeluaran & Biaya Operasional
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Catat dan kelola semua pengeluaran bahan baku, kemasan, dan operasional usaha.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary text-xs shadow-md flex items-center gap-2 py-2.5 px-4 rounded-xl"
        >
          <Plus size={16} /> Catat Pengeluaran Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Biaya Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-rose-600 dark:text-rose-400 tabular-nums">
            {formatRupiah(totalAmountFiltered)}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            {filteredExpenses.length} transaksi pada periode terpilih
          </p>
        </div>

        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kategori Biaya Terbesar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Filter size={16} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-base text-neutral-900 dark:text-white truncate">
            {topCategory ? topCategory[0] : '-'}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            {topCategory ? formatRupiah(topCategory[1]) : 'Belum ada pengeluaran'}
          </p>
        </div>

        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengeluaran Keseluruhan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-neutral-900 dark:text-white tabular-nums">
            {formatRupiah(totalAllTime)}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Akumulasi {expenses.length} transaksi tercatat
          </p>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bankzai-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari deskripsi biaya..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field py-2 text-xs min-w-[170px]"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
            <Calendar size={14} className="text-neutral-400" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none"
            />
          </div>
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white px-2 py-1"
              title="Lihat semua bulan"
            >
              Semua
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bankzai-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-[10px] text-neutral-500 dark:text-neutral-400">
                  Tanggal
                </th>
                <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-[10px] text-neutral-500 dark:text-neutral-400">
                  Kategori
                </th>
                <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-[10px] text-neutral-500 dark:text-neutral-400">
                  Deskripsi Biaya
                </th>
                <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-[10px] text-neutral-500 dark:text-neutral-400 text-right">
                  Nominal
                </th>
                <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-[10px] text-neutral-500 dark:text-neutral-400 text-center w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-white/[0.04]">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-neutral-600 dark:text-neutral-300 font-semibold whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-slate-200/60 dark:border-white/[0.06]">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-neutral-900 dark:text-white">
                      {e.description}
                    </td>
                    <td className="px-4 py-3.5 text-right font-heading font-extrabold text-rose-600 dark:text-rose-400 text-xs tabular-nums whitespace-nowrap">
                      - {formatRupiah(e.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          title="Edit Pengeluaran"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(e.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400 font-medium">
                    Tidak ada catatan pengeluaran pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12141a] rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Receipt size={18} className="text-rose-500" />
                {editItem ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Tanggal Pengeluaran
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field text-xs w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Kategori Biaya
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field text-xs w-full"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Nominal Biaya (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 150000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="input-field text-xs w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Beli biskuit gabin Hatari 10 bungkus..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field text-xs w-full resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2.5 px-4 text-xs shadow-md font-bold rounded-xl"
                >
                  {editItem ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12141a] rounded-3xl p-6 w-full max-w-sm border border-slate-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
                Hapus Catatan Pengeluaran?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Tindakan ini tidak dapat dibatalkan. Catatan biaya akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
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