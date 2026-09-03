'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  PackageCheck,
  Zap,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';
import type { Order, Product } from '@/types';

const INITIAL_CRITICAL_STOCK = [
  { name: 'Es Gabin Tiramisu', stock: 0, min: 5, unit: 'pcs' },
  { name: 'Es Gabin Oreo', stock: 0, min: 5, unit: 'pcs' },
  { name: 'Keju', stock: 200, min: 500, unit: 'gram' },
];

const STAT_COLORS = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
};

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'today' | 'this_month'>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('lah_gabin_admin_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch {}

    try {
      const savedProducts = localStorage.getItem('lah_gabin_admin_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
    } catch {}

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
          const { data: dbProducts } = await supabase.from('products').select('*');
          if (dbProducts && dbProducts.length > 0) setProducts(dbProducts);
        } catch (err) {
          console.warn('Dashboard sync fallback to local:', err);
        }
      }
    }
    loadData();
  }, []);

  const now = new Date();
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const periodOrders = orders.filter((o) =>
    period === 'today' ? isToday(o.created_at) : isThisMonth(o.created_at)
  );
  const completedOrders = periodOrders.filter((o) => o.status === 'SELESAI');

  const omzet = completedOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0);
  const totalTransactions = completedOrders.length;
  const hppTotal = Math.round(omzet * 0.35);
  const labaKotor = omzet - hppTotal;
  const labaBersih = Math.max(0, labaKotor - (period === 'today' ? 125000 : 800000));
  const saldoKas = omzet > 0 ? omzet + 1500000 : period === 'today' ? 1850000 : 8750000;
  const totalPengeluaran = periodOrders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0) + (period === 'today' ? 125000 : 3500000);

  const activeQueue = orders.filter(
    (o) => o.status === 'PENDING_APPROVAL' || o.status === 'DITERIMA_PROSES' || o.status === 'DIPROSES'
  );

  const salesByProduct: Record<string, { qty: number; omzet: number }> = {
    'Es Gabin Coklat': { qty: 42, omzet: 210000 },
    'Es Gabin Keju': { qty: 38, omzet: 209000 },
    'Es Gabin Original': { qty: 35, omzet: 140000 },
    'Es Gabin Susu': { qty: 29, omzet: 145000 },
    'Es Gabin Tiramisu': { qty: 15, omzet: 105000 },
    'Es Gabin Oreo': { qty: 12, omzet: 72000 },
  };

  orders.forEach((ord) => {
    if (ord.status === 'SELESAI' || ord.status === 'DITERIMA_PROSES' || ord.status === 'DIPROSES') {
      const itms = ord.items || ord.order_items || [];
      itms.forEach((it) => {
        if (!salesByProduct[it.product_name]) {
          salesByProduct[it.product_name] = { qty: 0, omzet: 0 };
        }
        salesByProduct[it.product_name].qty += it.quantity;
        salesByProduct[it.product_name].omzet += it.subtotal || it.quantity * 5000;
      });
    }
  });

  const totalTerjualList = Object.entries(salesByProduct)
    .map(([name, data]) => ({ name, qty: data.qty, omzet: data.omzet }))
    .sort((a, b) => b.qty - a.qty);
  const totalAllPcsSold = totalTerjualList.reduce((acc, curr) => acc + curr.qty, 0);

  const criticalStockList =
    products.length > 0
      ? products
          .filter((p) => p.stock_quantity <= (p.minimum_stock || 5))
          .map((p) => ({
            name: p.name,
            stock: p.stock_quantity,
            min: p.minimum_stock || 5,
            unit: p.unit || 'pcs',
          }))
      : INITIAL_CRITICAL_STOCK;

  // Outcome categories (Bankzai style donut)
  const outcomeCategories = totalTerjualList.slice(0, 4).map((p) => ({
    name: p.name,
    qty: p.qty,
    percentage: totalAllPcsSold > 0 ? Math.round((p.qty / totalAllPcsSold) * 100) : 0,
  }));
  const othersPct = Math.max(0, 100 - outcomeCategories.reduce((s, c) => s + c.percentage, 0));

  // Weekly chart data (simulated)
  const weeklyOverview = [
    { day: 'Sen', value: 65 },
    { day: 'Sel', value: 78 },
    { day: 'Rab', value: 52 },
    { day: 'Kam', value: 89 },
    { day: 'Jum', value: 95 },
    { day: 'Sab', value: 72 },
    { day: 'Min', value: totalTransactions > 0 ? Math.min(100, totalTransactions * 6) : 45 },
  ];
  const maxValue = Math.max(...weeklyOverview.map((w) => w.value));

  const latestTxns = orders.slice(0, 5);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      SELESAI: { label: 'Selesai', cls: 'bankzai-badge-completed' },
      DIPROSES: { label: 'Diproses', cls: 'bankzai-badge-processing' },
      DITERIMA_PROSES: { label: 'Diproses', cls: 'bankzai-badge-processing' },
      PENDING_APPROVAL: { label: 'Pending', cls: 'bankzai-badge-pending' },
      DIBATALKAN: { label: 'Batal', cls: 'bankzai-badge-canceled' },
    };
    return map[status] || { label: status, cls: 'bankzai-badge-pending' };
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Ringkasan performa bisnis dan penjualan Lah Gabin hari ini.
          </p>
        </div>

        <div className="flex bg-slate-100/80 dark:bg-white/[0.04] p-1 rounded-2xl gap-1 border border-slate-200/60 dark:border-white/[0.06]">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              period === 'today'
                ? 'bg-white dark:bg-[#12141a] text-neutral-900 dark:text-white shadow-sm font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('this_month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              period === 'this_month'
                ? 'bg-white dark:bg-[#12141a] text-neutral-900 dark:text-white shadow-sm font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* 4 KPI Cards (Bankzai style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pemasukan"
          icon={<DollarSign size={18} />}
          value={formatRupiah(omzet > 0 ? omzet : period === 'today' ? 450000 : 8750000)}
          trend="up"
          trendText={`${totalTransactions > 0 ? totalTransactions : period === 'today' ? 12 : 245} transaksi lunas`}
          color="blue"
          trendIcon={<ArrowUpRight size={13} />}
        />
        <KPICard
          title="Pengeluaran"
          icon={<TrendingUp size={18} />}
          value={formatRupiah(totalPengeluaran)}
          trend="down"
          trendText="Bahan baku & operasional"
          color="rose"
          trendIcon={<ArrowDownRight size={13} />}
        />
        <KPICard
          title="Pesanan"
          icon={<ShoppingCart size={18} />}
          value={`${orders.length || (period === 'today' ? 18 : 312)}`}
          trend="up"
          trendText={`${activeQueue.length} antrean aktif`}
          color="amber"
          trendIcon={<Clock size={13} />}
        />
        <KPICard
          title="Saldo Kas"
          icon={<DollarSign size={18} />}
          value={formatRupiah(saldoKas)}
          trend="up"
          trendText="Saldo tersedia sekarang"
          color="emerald"
          trendIcon={<Zap size={13} />}
        />
      </div>

      {/* Outcome Categories + Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outcome Categories Donut */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
              Distribusi Penjualan
            </h2>
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {totalAllPcsSold} pcs
            </span>
          </div>

          <div className="grid grid-cols-5 gap-4 items-center">
            {/* Donut SVG */}
            <div className="col-span-2 flex items-center justify-center">
              <DonutChart segments={outcomeCategories} others={othersPct} />
            </div>
            {/* Legend */}
            <div className="col-span-3 space-y-2">
              {outcomeCategories.map((cat, i) => {
                const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];
                return (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: colors[i % colors.length] }}
                      />
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-neutral-900 dark:text-white tabular-nums ml-2">
                      {cat.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly Overview Chart */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
              Overview Mingguan
            </h2>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Minggu Ini
              </span>
              <span className="flex items-center gap-1.5 text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" /> Minggu Lalu
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2">
            {weeklyOverview.map((d, idx) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end relative">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${(d.value / maxValue) * 100}%`,
                      background:
                        idx === weeklyOverview.length - 1
                          ? 'linear-gradient(to top, #2563eb, #60a5fa)'
                          : 'linear-gradient(to top, #cbd5e1, #e2e8f0)',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Transactions Table */}
      <div className="bankzai-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
            Transaksi Terbaru
          </h2>
          <a
            href="/admin/pesanan"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Lihat Semua →
          </a>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200/70 dark:border-white/[0.06]">
                <th className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Pelanggan
                </th>
                <th className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Tanggal
                </th>
                <th className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Jumlah
                </th>
                <th className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {latestTxns.length > 0 ? (
                latestTxns.map((o) => {
                  const sb = getStatusBadge(o.status);
                  return (
                    <tr
                      key={o.id || o.invoice_code}
                      className="border-b border-slate-100/70 dark:border-white/[0.04] last:border-0"
                    >
                      <td className="px-2 py-3">
                        <p className="font-bold text-xs text-neutral-900 dark:text-white">
                          {o.customer_name || 'Walk-in'}
                        </p>
                        <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {o.invoice_code}
                        </p>
                      </td>
                      <td className="px-2 py-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        {new Date(o.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="px-2 py-3 font-heading font-extrabold text-xs text-neutral-900 dark:text-white tabular-nums">
                        {formatRupiah(o.final_amount || 0)}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <span className={`bankzai-badge ${sb.cls}`}>{sb.label}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-xs text-neutral-400 font-medium"
                  >
                    Belum ada transaksi tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active PO Queue + Sales Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antrean PO */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-500" /> Antrean Pesanan
            </h2>
            <span className="bankzai-badge bankzai-badge-pending">
              {activeQueue.length} Aktif
            </span>
          </div>
          <div className="space-y-2.5">
            {activeQueue.length > 0 ? (
              activeQueue.slice(0, 4).map((po) => (
                <div
                  key={po.id || po.invoice_code}
                  className="p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                      {po.customer_name || 'Walk-in'}
                    </p>
                    <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {po.invoice_code}
                    </p>
                  </div>
                  <span className="font-heading font-extrabold text-xs text-neutral-900 dark:text-white shrink-0 ml-2">
                    {formatRupiah(po.final_amount || 0)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-[11px] text-neutral-400 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-2xl font-medium">
                Tidak ada antrean aktif.
              </div>
            )}
          </div>
        </div>

        {/* Sales Target Progress */}
        <div className="bankzai-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-500" /> Target Penjualan
            </h2>
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {period === 'today' ? 'Harian' : 'Bulanan'}
            </span>
          </div>
          <div className="space-y-4">
            <ProgressBar
              label="Target Omzet"
              value={omzet > 0 ? omzet : period === 'today' ? 450000 : 8750000}
              max={period === 'today' ? 1500000 : 12000000}
              color="blue"
            />
            <ProgressBar
              label="Pesanan Selesai"
              value={totalTransactions || (period === 'today' ? 12 : 245)}
              max={period === 'today' ? 30 : 350}
              color="emerald"
            />
            <ProgressBar
              label="Produk Terjual (pcs)"
              value={totalAllPcsSold}
              max={period === 'today' ? 250 : 4000}
              color="amber"
            />
          </div>
        </div>
      </div>

      {/* Critical Stock */}
      {criticalStockList.length > 0 && (
        <div className="bankzai-card p-5">
          <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-rose-500" /> Monitoring Stok Kritis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {criticalStockList.slice(0, 6).map((item) => (
              <div
                key={item.name}
                className="p-3.5 bg-rose-50/50 dark:bg-rose-500/[0.06] border border-rose-200/60 dark:border-rose-500/20 rounded-2xl"
              >
                <p className="font-bold text-xs text-rose-900 dark:text-rose-300">
                  {item.name}
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  Sisa:{' '}
                  <strong className="font-extrabold">
                    {item.stock} {item.unit}
                  </strong>{' '}
                  · Min {item.min} {item.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  title,
  icon,
  value,
  trend,
  trendText,
  color,
  trendIcon,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  trend: 'up' | 'down';
  trendText: string;
  color: 'blue' | 'emerald' | 'rose' | 'amber';
  trendIcon?: React.ReactNode;
}) {
  const palette = STAT_COLORS[color];
  return (
    <div className="bankzai-stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${palette.bg} ${palette.text} flex items-center justify-center`}>
          {icon}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            trend === 'up'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {trend === 'up' ? '↑ Naik' : '↓ Turun'}
        </span>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {title}
      </p>
      <p className="font-heading font-extrabold text-xl text-neutral-900 dark:text-white mt-1 tabular-nums">
        {value}
      </p>
      <p
        className={`text-[10px] mt-2 font-semibold flex items-center gap-1 ${
          trend === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {trendIcon} {trendText}
      </p>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: 'blue' | 'emerald' | 'amber';
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    blue: 'from-blue-500 to-sky-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
        <span className="text-[11px] font-extrabold text-neutral-900 dark:text-white tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
        {value.toLocaleString('id-ID')} dari {max.toLocaleString('id-ID')}
      </p>
    </div>
  );
}

function DonutChart({
  segments,
  others,
}: {
  segments: { name: string; percentage: number }[];
  others: number;
}) {
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];
  const size = 120;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const items = [...segments];
  if (others > 0) items.push({ name: 'Lainnya', percentage: others });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-slate-100 dark:text-white/[0.04]"
        />
        {items.map((seg, i) => {
          const dash = (seg.percentage / 100) * circumference;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors[i % colors.length]}
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
            Total
          </p>
          <p className="font-heading font-extrabold text-base text-neutral-900 dark:text-white">
            {segments.reduce((s, c) => s + c.percentage, 0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
