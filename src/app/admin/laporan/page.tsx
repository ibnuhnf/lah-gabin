'use client';

import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const MOCK_REPORTS = {
  penjualan: {
    daily: [
      { date: '01 Sep', omzet: 450000, qty: 35, orders: 12 },
      { date: '02 Sep', omzet: 580000, qty: 42, orders: 16 },
    ],
    monthly: { omzet: 8750000, orders: 245, avgPerDay: 291666, topProduct: 'Es Gabin Coklat' },
  },
  laba_rugi: {
    pendapatan: 8750000,
    hpp_total: 3500000,
    laba_kotor: 5250000,
    biaya_ops: 3200000,
    laba_bersih: 2050000,
  },
  pengeluaran_per_kategori: [
    { kategori: 'Bahan Baku', total: 1750000, persen: 54.7 },
    { kategori: 'Kemasan / Packaging', total: 425000, persen: 13.3 },
    { kategori: 'Operasional', total: 500000, persen: 15.6 },
    { kategori: 'Transportasi', total: 180000, persen: 5.6 },
    { kategori: 'Marketing', total: 300000, persen: 9.4 },
    { kategori: 'Lain-lain', total: 45000, persen: 1.4 },
  ],
};

type ReportType = 'penjualan' | 'laba_rugi' | 'pengeluaran';

export default function AdminReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('laba_rugi');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-neutral-900 flex items-center gap-2">
            <BarChart3 size={22} /> Laporan
          </h1>
          <p className="text-sm text-neutral-500">Analisis keuangan dan operasional bisnis.</p>
        </div>
        <button className="btn-secondary text-sm flex items-center gap-2">
          <Download size={16} /> Ekspor CSV
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'laba_rugi', label: 'Laba Rugi' },
          { key: 'penjualan', label: 'Penjualan' },
          { key: 'pengeluaran', label: 'Pengeluaran per Kategori' },
        ] as { key: ReportType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveReport(key)}
            className={`px-4 py-2 text-sm rounded-xl transition-colors ${
              activeReport === key
                ? 'bg-brand-900 text-white font-bold'
                : 'bg-white text-neutral-600 border border-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Laba Rugi */}
      {activeReport === 'laba_rugi' && (
        <div className="card p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Laporan Laba Rugi — September 2026</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-neutral-200 pb-2">
              <span className="font-semibold">Pendapatan (Omzet Net)</span>
              <span className="font-bold text-brand-900">{formatRupiah(MOCK_REPORTS.laba_rugi.pendapatan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600 ml-4">(-) HPP Total</span>
              <span className="text-danger-500">- {formatRupiah(MOCK_REPORTS.laba_rugi.hpp_total)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-neutral-200 pb-2">
              <span className="font-semibold text-success-500">= Laba Kotor</span>
              <span className="font-bold text-success-500">{formatRupiah(MOCK_REPORTS.laba_rugi.laba_kotor)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600 ml-4">(-) Biaya Operasional</span>
              <span className="text-danger-500">- {formatRupiah(MOCK_REPORTS.laba_rugi.biaya_ops)}</span>
            </div>
            <div className="flex justify-between text-base border-t-2 border-brand-900 pt-2 mt-2">
              <span className="font-heading font-bold">= LABA BERSIH</span>
              <span className="font-heading font-bold text-accent-500">{formatRupiah(MOCK_REPORTS.laba_rugi.laba_bersih)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Penjualan */}
      {activeReport === 'penjualan' && (
        <div className="card p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Ringkasan Penjualan</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="kpi-card"><span className="text-xs text-neutral-500">Omzet Bulan Ini</span><p className="font-heading font-bold text-lg">{formatRupiah(MOCK_REPORTS.penjualan.monthly.omzet)}</p></div>
            <div className="kpi-card"><span className="text-xs text-neutral-500">Total Transaksi</span><p className="font-heading font-bold text-lg">{MOCK_REPORTS.penjualan.monthly.orders}</p></div>
            <div className="kpi-card"><span className="text-xs text-neutral-500">Produk Terlaris</span><p className="font-heading font-bold text-sm">{MOCK_REPORTS.penjualan.monthly.topProduct}</p></div>
          </div>
          <table className="w-full text-sm">
            <thead className="table-header"><tr><th className="text-left px-4 py-3 font-semibold">Tanggal</th><th className="text-right px-4 py-3 font-semibold">Omzet</th><th className="text-right px-4 py-3 font-semibold">Qty Terjual</th><th className="text-right px-4 py-3 font-semibold">Transaksi</th></tr></thead>
            <tbody>
              {MOCK_REPORTS.penjualan.daily.map((d) => (
                <tr key={d.date} className="table-row">
                  <td className="px-4 py-3">{d.date}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatRupiah(d.omzet)}</td>
                  <td className="px-4 py-3 text-right">{d.qty} pcs</td>
                  <td className="px-4 py-3 text-right">{d.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pengeluaran per Kategori */}
      {activeReport === 'pengeluaran' && (
        <div className="card p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Pengeluaran per Kategori</h2>
          <div className="space-y-3">
            {MOCK_REPORTS.pengeluaran_per_kategori.map((cat) => (
              <div key={cat.kategori} className="flex items-center gap-3">
                <span className="text-sm text-neutral-700 w-40 shrink-0">{cat.kategori}</span>
                <div className="flex-1 bg-neutral-100 rounded-full h-4 relative overflow-hidden">
                  <div className="bg-brand-600 h-full rounded-full" style={{ width: `${cat.persen}%` }} />
                </div>
                <span className="text-sm font-bold w-24 text-right">{formatRupiah(cat.total)}</span>
                <span className="text-xs text-neutral-400 w-12 text-right">{cat.persen}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
