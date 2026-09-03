'use client';

import { useState } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Receipt } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function AdminReportsPage() {
  const [month, setMonth] = useState('2026-09');

  const reportData = {
    omzet_total: 8750000,
    hpp_total: 3500000,
    laba_kotor: 5250000,
    biaya_operasional: 1200000,
    laba_bersih: 4050000,
    total_unit_terjual: 245,
    channel_breakdown: [
      { name: 'Online (Web & WA)', omzet: 5250000, unit: 145 },
      { name: 'POS / Kasir Langsung', omzet: 3500000, unit: 100 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 size={24} className="text-accent-500" /> Laporan Keuangan & Laba Rugi
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Analisis omzet, HPP, margin laba, dan profitabilitas usaha.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field py-2 text-xs w-auto"
          />
          <button className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
            <Download size={14} /> Ekspor PDF
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-xs font-medium">Total Omzet</span>
            <DollarSign size={16} className="text-accent-500" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-neutral-900 dark:text-white">
            {formatRupiah(reportData.omzet_total)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">{reportData.total_unit_terjual} pcs gabin terjual</span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-xs font-medium">Laba Kotor</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
            {formatRupiah(reportData.laba_kotor)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Margin Kotor: 60%</span>
        </div>

        <div className="kpi-card border-2 border-accent-500/40">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-xs font-bold text-accent-600 dark:text-accent-400">Laba Bersih (Net Profit)</span>
            <Receipt size={16} className="text-accent-500" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-accent-500">
            {formatRupiah(reportData.laba_bersih)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Net Margin: 46.3%</span>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="card p-5">
        <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white mb-4">
          Breakdown Saluran Penjualan
        </h2>
        <div className="space-y-3">
          {reportData.channel_breakdown.map((ch) => (
            <div key={ch.name} className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-neutral-900 dark:text-white text-sm">{ch.name}</p>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">{ch.unit} unit transaksi</p>
              </div>
              <span className="font-heading font-extrabold text-sm text-neutral-900 dark:text-white">
                {formatRupiah(ch.omzet)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
