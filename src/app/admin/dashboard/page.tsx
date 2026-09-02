'use client';

import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'today' | 'this_month'>('today');

  const stats = {
    today: {
      omzet: 450000,
      total_transactions: 12,
      kas_masuk: 450000,
      kas_keluar: 125000,
      saldo_kas: 1850000,
      hpp_total: 185000,
      laba_kotor: 265000,
      laba_bersih: 140000,
    },
    this_month: {
      omzet: 8750000,
      total_transactions: 245,
      kas_masuk: 8750000,
      kas_keluar: 3200000,
      saldo_kas: 1850000,
      hpp_total: 3500000,
      laba_kotor: 5250000,
      laba_bersih: 2050000,
    },
  }[period];

  const criticalStock = [
    { name: 'Es Gabin Tiramisu', stock: 0, min: 5, unit: 'pcs' },
    { name: 'Es Gabin Oreo', stock: 0, min: 5, unit: 'pcs' },
    { name: 'Keju', stock: 200, min: 500, unit: 'gram' },
  ];

  const poQueue = [
    { code: 'LG-20260902-A1B2', customer: 'Budi', item: 'Es Gabin Tiramisu x5', total: 35000 },
    { code: 'LG-20260902-C3D4', customer: 'Siti', item: 'Es Gabin Oreo x3', total: 18000 },
  ];

  const topProducts = [
    { name: 'Es Gabin Coklat', qty: 42, omzet: 210000 },
    { name: 'Es Gabin Keju', qty: 38, omzet: 209000 },
    { name: 'Es Gabin Original', qty: 35, omzet: 140000 },
    { name: 'Es Gabin Susu', qty: 29, omzet: 145000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-neutral-900">Dashboard Analitik</h1>
          <p className="text-sm text-neutral-500">Ringkasan performa bisnis dan operasional Lah Gabin.</p>
        </div>

        <div className="flex bg-white rounded-xl p-1 border border-neutral-200">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              period === 'today' ? 'bg-brand-900 text-white' : 'text-neutral-600'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('this_month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              period === 'this_month' ? 'bg-brand-900 text-white' : 'text-neutral-600'
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Omzet</span>
            <DollarSign size={16} className="text-brand-600" />
          </div>
          <p className="font-heading font-bold text-lg text-brand-900">{formatRupiah(stats.omzet)}</p>
          <span className="text-[10px] text-success-500 flex items-center gap-0.5 mt-1 font-medium">
            <ArrowUpRight size={12} /> {stats.total_transactions} transaksi
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Laba Kotor</span>
            <TrendingUp size={16} className="text-success-500" />
          </div>
          <p className="font-heading font-bold text-lg text-success-500">{formatRupiah(stats.laba_kotor)}</p>
          <span className="text-[10px] text-neutral-400 mt-1 block">Omzet - HPP</span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Laba Bersih</span>
            <TrendingUp size={16} className="text-accent-500" />
          </div>
          <p className="font-heading font-bold text-lg text-accent-500">{formatRupiah(stats.laba_bersih)}</p>
          <span className="text-[10px] text-neutral-400 mt-1 block">Laba Kotor - Biaya Ops</span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Saldo Kas</span>
            <DollarSign size={16} className="text-brand-900" />
          </div>
          <p className="font-heading font-bold text-lg text-neutral-900">{formatRupiah(stats.saldo_kas)}</p>
          <span className="text-[10px] text-neutral-400 mt-1 block">Kas Masuk - Kas Keluar</span>
        </div>
      </div>

      {/* Grid 2: PO Queue + Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Antrean PO */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-base text-neutral-900 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> Antrean Pre-Order (PO)
            </h2>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {poQueue.length} Order
            </span>
          </div>
          <div className="space-y-3">
            {poQueue.map((po) => (
              <div key={po.code} className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold text-neutral-900">{po.customer} <span className="text-xs font-normal text-neutral-400">({po.code})</span></p>
                  <p className="text-xs text-neutral-600">{po.item}</p>
                </div>
                <span className="font-bold text-brand-800">{formatRupiah(po.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Produk Terlaris */}
        <div className="card p-5">
          <h2 className="font-heading font-bold text-base text-neutral-900 mb-4">
            Produk Terlaris
          </h2>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between text-sm py-1 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-neutral-400">#{idx + 1}</span>
                  <span className="font-medium text-neutral-900">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">{p.qty} pcs</p>
                  <p className="text-xs text-neutral-400">{formatRupiah(p.omzet)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stok Kritis */}
      <div className="card p-5">
        <h2 className="font-heading font-bold text-base text-neutral-900 flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-danger-500" /> Monitoring Stok Kritis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {criticalStock.map((item) => (
            <div key={item.name} className="p-3 bg-red-50/60 border border-red-100 rounded-xl">
              <p className="font-bold text-sm text-red-900">{item.name}</p>
              <p className="text-xs text-red-600 mt-1">
                Sisa: <strong className="text-red-700">{item.stock} {item.unit}</strong> (Min: {item.min} {item.unit})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
