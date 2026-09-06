'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  Receipt,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  PieChart,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';
import { Order, Product } from '@/types';
import { ExpenseItem } from '../pengeluaran/page';

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: '1', date: '2026-09-01', category: 'Bahan Baku', amount: 350000, description: 'Beli biskuit gabin, susu, keju (mingguan)' },
  { id: '2', date: '2026-09-01', category: 'Kemasan / Packaging', amount: 85000, description: 'Plastik klip 500 pcs + stiker label' },
  { id: '3', date: '2026-08-30', category: 'Operasional (Gas / Listrik / Air)', amount: 250000, description: 'Token listrik freezer + isi gas' },
  { id: '4', date: '2026-08-29', category: 'Transportasi / Logistik', amount: 45000, description: 'Ongkir kirim bahan baku' },
  { id: '5', date: '2026-08-25', category: 'Marketing / Iklan', amount: 100000, description: 'Boost IG story promo opening 7 hari' },
];

export default function AdminReportsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Load all synchronized data on mount
  useEffect(() => {
    // 1. LocalStorage initial load
    try {
      const savedOrders = localStorage.getItem('lah_gabin_admin_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch {}

    try {
      const savedExpenses = localStorage.getItem('lah_gabin_admin_expenses');
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      else setExpenses(INITIAL_EXPENSES);
    } catch {}

    try {
      const savedProducts = localStorage.getItem('lah_gabin_admin_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
    } catch {}

    // 2. Supabase remote fetch
    async function loadData() {
      if (isSupabaseConfigured()) {
        try {
          const { data: dbOrders } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });
          if (dbOrders && dbOrders.length > 0) {
            const formatted = dbOrders.map((o) => ({
              ...o,
              items: o.order_items || o.items || [],
            }));
            setOrders(formatted);
          }

          const { data: dbExpenses } = await supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });
          if (dbExpenses && dbExpenses.length > 0) {
            const mapped: ExpenseItem[] = dbExpenses.map((d: Record<string, unknown>) => ({
              id: String(d.id),
              date: String(d.expense_date || d.created_at || '').slice(0, 10),
              category: String(d.category || 'Operasional'),
              amount: Number(d.amount) || 0,
              description: String(d.description || '-'),
            }));
            setExpenses(mapped);
          }

          const { data: dbProducts } = await supabase.from('products').select('*');
          if (dbProducts && dbProducts.length > 0) {
            setProducts(dbProducts);
          }
        } catch (err) {
          console.warn('Laporan sync fallback to local:', err);
        }
      }
    }

    loadData();

    // 3. Storage event listener for realtime updates across tabs
    function syncStorage(e: StorageEvent) {
      if (e.key === 'lah_gabin_admin_orders' && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'lah_gabin_admin_expenses' && e.newValue) {
        try {
          setExpenses(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'lah_gabin_admin_products' && e.newValue) {
        try {
          setProducts(JSON.parse(e.newValue));
        } catch {}
      }
    }

    window.addEventListener('storage', syncStorage);
    return () => window.removeEventListener('storage', syncStorage);
  }, []);

  // Filter orders by month & completed status (or all active paid transactions)
  const monthOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderMonth = (o.created_at || '').slice(0, 7);
      const isCompleted = o.status === 'SELESAI';
      return (!month || orderMonth === month) && isCompleted;
    });
  }, [orders, month]);

  // Filter expenses by selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expenseMonth = (e.date || '').slice(0, 7);
      return !month || expenseMonth === month;
    });
  }, [expenses, month]);

  // Financial Calculations (Sederhana: Pendapatan Bulan Ini - Pengeluaran Bulan Ini)
  const calculations = useMemo(() => {
    const omzet_total = monthOrders.reduce((acc, o) => acc + (Number(o.final_amount) || 0), 0);
    const total_transaksi = monthOrders.length;

    // Total unit terjual
    let total_unit_terjual = 0;
    monthOrders.forEach((o) => {
      const items = o.items || o.order_items || [];
      items.forEach((it) => {
        total_unit_terjual += Number(it.quantity) || 0;
      });
    });

    const pengeluaran_total = monthExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const laba_bersih = omzet_total - pengeluaran_total;
    const margin_bersih_pct = omzet_total > 0 ? (laba_bersih / omzet_total) * 100 : 0;

    // Breakdown Channel
    const onlineOrders = monthOrders.filter((o) => o.order_source === 'ONLINE');
    const posOrders = monthOrders.filter((o) => o.order_source === 'POS');

    const onlineOmzet = onlineOrders.reduce((s, o) => s + (Number(o.final_amount) || 0), 0);
    const posOmzet = posOrders.reduce((s, o) => s + (Number(o.final_amount) || 0), 0);

    const onlineUnits = onlineOrders.reduce(
      (s, o) => s + (o.items || o.order_items || []).reduce((iq, it) => iq + (Number(it.quantity) || 0), 0),
      0
    );
    const posUnits = posOrders.reduce(
      (s, o) => s + (o.items || o.order_items || []).reduce((iq, it) => iq + (Number(it.quantity) || 0), 0),
      0
    );

    // Breakdown Expense by Category
    const expenseByCategory: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    return {
      omzet_total,
      total_transaksi,
      total_unit_terjual,
      pengeluaran_total,
      laba_bersih,
      margin_bersih_pct,
      channel_breakdown: [
        {
          name: 'Online (Web & WhatsApp)',
          omzet: onlineOmzet,
          transactions: onlineOrders.length,
          unit: onlineUnits,
          icon: <ShoppingBag size={18} className="text-blue-500" />,
        },
        {
          name: 'POS / Kasir Langsung (Outlet)',
          omzet: posOmzet,
          transactions: posOrders.length,
          unit: posUnits,
          icon: <Store size={18} className="text-emerald-500" />,
        },
      ],
      expense_breakdown: Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]),
    };
  }, [monthOrders, monthExpenses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 size={26} className="text-emerald-500" /> Laporan Keuangan & Laba Bersih
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Perhitungan laba bersih bulanan: <strong>Pendapatan Penjualan dikurangi Pengeluaran Operasional</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] px-3 py-2 rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
            <Calendar size={14} className="text-neutral-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none"
            />
          </div>
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 rounded-xl font-bold"
          >
            <Printer size={14} /> Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* Print-only Title Header */}
      <div className="hidden print:block mb-6 border-b border-neutral-300 pb-4">
        <h1 className="text-2xl font-bold text-black">LAH GABIN - LAPORAN KEUANGAN BULANAN</h1>
        <p className="text-sm text-neutral-600">
          Periode: {month || 'Semua Periode'} | Dicetak pada: {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pendapatan (Omzet)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-neutral-900 dark:text-white tabular-nums">
            {formatRupiah(calculations.omzet_total)}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium flex items-center gap-1">
            <span>{calculations.total_unit_terjual} pcs gabin</span>
            <span>•</span>
            <span>{calculations.total_transaksi} transaksi selesai</span>
          </p>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-rose-600 dark:text-rose-400 tabular-nums">
            {formatRupiah(calculations.pengeluaran_total)}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            {monthExpenses.length} transaksi pengeluaran
          </p>
        </div>

        {/* Laba Bersih Bulan Ini */}
        <div className="bankzai-card p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.04] to-transparent">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Laba Bersih (Net Profit)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p
            className={`font-heading font-extrabold text-2xl tabular-nums ${
              calculations.laba_bersih >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRupiah(calculations.laba_bersih)}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Pendapatan dikurangi Pengeluaran
          </p>
        </div>

        {/* Margin Laba */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Profit Margin</span>
            <div className="w-8 h-8 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-neutral-900 dark:text-white tabular-nums">
            {calculations.margin_bersih_pct.toFixed(1)}%
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Rasio laba terhadap omzet
          </p>
        </div>
      </div>

      {/* Income Statement Table (Laporan Laba Rugi Sederhana) */}
      <div className="bankzai-card p-6">
        <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers size={18} className="text-blue-500" /> Ringkasan Laporan Laba Bersih Bulanan
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] text-left">
                <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Komponen Keuangan</th>
                <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 text-right w-40">Nominal (Rp)</th>
                <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 text-right w-28">% dari Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {/* Pendapatan Penjualan */}
              <tr className="font-bold bg-slate-50/50 dark:bg-white/[0.02] text-neutral-900 dark:text-white">
                <td className="py-3">1. Total Pendapatan Penjualan (Omzet)</td>
                <td className="py-3 text-right font-heading text-sm tabular-nums text-emerald-600 dark:text-emerald-400 font-extrabold">
                  + {formatRupiah(calculations.omzet_total)}
                </td>
                <td className="py-3 text-right text-neutral-500">100.0%</td>
              </tr>
              {/* Beban Pengeluaran Itemized */}
              {calculations.expense_breakdown.length > 0 ? (
                calculations.expense_breakdown.map(([cat, amt]) => (
                  <tr key={cat} className="text-neutral-600 dark:text-neutral-300">
                    <td className="py-2.5 pl-4">Pengeluaran: {cat}</td>
                    <td className="py-2.5 text-right font-medium text-rose-500 tabular-nums">
                      - {formatRupiah(amt)}
                    </td>
                    <td className="py-2.5 text-right text-neutral-500">
                      {calculations.omzet_total > 0 ? ((amt / calculations.omzet_total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="text-neutral-500 italic">
                  <td className="py-2.5 pl-4">Tidak ada pengeluaran tercatat pada periode ini</td>
                  <td className="py-2.5 text-right tabular-nums">Rp 0</td>
                  <td className="py-2.5 text-right">0.0%</td>
                </tr>
              )}
              {/* Total Pengeluaran */}
              <tr className="font-bold text-neutral-900 dark:text-white">
                <td className="py-2.5">2. Total Pengeluaran Bulan Ini</td>
                <td className="py-2.5 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  - {formatRupiah(calculations.pengeluaran_total)}
                </td>
                <td className="py-2.5 text-right text-neutral-500">
                  {calculations.omzet_total > 0
                    ? ((calculations.pengeluaran_total / calculations.omzet_total) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
              {/* Laba Bersih */}
              <tr className="font-extrabold bg-emerald-500/10 text-neutral-900 dark:text-white border-t-2 border-emerald-500/30">
                <td className="py-3.5 text-sm">3. Laba Bersih Bulan Ini (Pendapatan - Pengeluaran)</td>
                <td
                  className={`py-3.5 text-right font-heading text-base tabular-nums ${
                    calculations.laba_bersih >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatRupiah(calculations.laba_bersih)}
                </td>
                <td className="py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {calculations.margin_bersih_pct.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Channel Breakdown + Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="bankzai-card p-5">
          <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-accent-500" /> Saluran Penjualan (Online vs POS)
          </h2>
          <div className="space-y-3.5">
            {calculations.channel_breakdown.map((ch) => {
              const pct = calculations.omzet_total > 0 ? Math.round((ch.omzet / calculations.omzet_total) * 100) : 0;
              return (
                <div
                  key={ch.name}
                  className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                        {ch.icon}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-xs">{ch.name}</p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {ch.transactions} transaksi • {ch.unit} pcs terjual
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-extrabold text-sm text-neutral-900 dark:text-white block tabular-nums">
                        {formatRupiah(ch.omzet)}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-500">{pct}% dari total</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="bankzai-card p-5">
          <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Receipt size={18} className="text-rose-500" /> Rincian Beban Biaya Operasional
          </h2>
          <div className="space-y-3">
            {calculations.expense_breakdown.length > 0 ? (
              calculations.expense_breakdown.map(([cat, amt]) => {
                const pct =
                  calculations.biaya_operasional > 0
                    ? Math.round((amt / calculations.biaya_operasional) * 100)
                    : 0;
                return (
                  <div
                    key={cat}
                    className="p-3 bg-slate-50/80 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">{cat}</p>
                        <p className="text-[10px] text-neutral-400">{pct}% dari total beban</p>
                      </div>
                    </div>
                    <span className="font-heading font-extrabold text-xs text-rose-600 dark:text-rose-400 tabular-nums">
                      - {formatRupiah(amt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-neutral-400 text-xs">
                Tidak ada catatan pengeluaran pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

