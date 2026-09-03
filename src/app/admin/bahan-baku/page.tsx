'use client';

import { useState } from 'react';
import { Plus, Calculator } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const MOCK_MATERIALS = [
  { id: '1', name: 'Gabin', unit: 'pcs', cost_per_unit: 250, stock_quantity: 500 },
  { id: '2', name: 'Susu Kental Manis', unit: 'gram', cost_per_unit: 22, stock_quantity: 5000 },
  { id: '3', name: 'Tepung Terigu', unit: 'gram', cost_per_unit: 12, stock_quantity: 3000 },
  { id: '4', name: 'Gula Pasir', unit: 'gram', cost_per_unit: 14, stock_quantity: 2000 },
  { id: '5', name: 'Minyak Goreng', unit: 'ml', cost_per_unit: 17, stock_quantity: 5000 },
  { id: '7', name: 'Margarin', unit: 'gram', cost_per_unit: 30, stock_quantity: 2000 },
  { id: '8', name: 'Keju', unit: 'gram', cost_per_unit: 90, stock_quantity: 1500 },
  { id: '9', name: 'Coklat Meises', unit: 'gram', cost_per_unit: 75, stock_quantity: 1000 },
  { id: '10', name: 'Oreo', unit: 'pcs', cost_per_unit: 350, stock_quantity: 500 },
];

const RECIPE_EXAMPLE = [
  { material: 'Gabin', qty: 20, unit: 'pcs', cost: 250, subtotal: 5000 },
  { material: 'Susu Kental Manis', qty: 180, unit: 'gram', cost: 22, subtotal: 3960 },
  { material: 'Tepung Terigu', qty: 150, unit: 'gram', cost: 12, subtotal: 1800 },
  { material: 'Gula Pasir', qty: 100, unit: 'gram', cost: 14, subtotal: 1400 },
  { material: 'Minyak Goreng', qty: 200, unit: 'ml', cost: 17, subtotal: 3400 },
];

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState(MOCK_MATERIALS);

  const totalBatchCost = RECIPE_EXAMPLE.reduce((s, i) => s + i.subtotal, 0);
  const batchYield = 20;
  const hppPerPcs = Math.round(totalBatchCost / batchYield);
  const basePrice = 5000;
  const labaKotor = basePrice - hppPerPcs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Calculator size={24} className="text-accent-500" /> Bahan Baku & Engine HPP
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Master harga bahan baku dan kalkulasi HPP otomatis berbasis resep batch.</p>
      </div>

      {/* HPP Engine Live Simulator */}
      <div className="card p-5 border-2 border-accent-500/40 bg-accent-50/20 dark:bg-accent-950/10">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={18} className="text-accent-500" />
          <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white">Simulasi Resep & HPP</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="kpi-card">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Biaya per Batch</span>
            <p className="font-heading font-extrabold text-xl text-neutral-900 dark:text-white mt-1">{formatRupiah(totalBatchCost)}</p>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">untuk {batchYield} pcs produk</span>
          </div>

          <div className="kpi-card">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">HPP per Pcs</span>
            <p className="font-heading font-extrabold text-xl text-accent-500 mt-1">{formatRupiah(hppPerPcs)}</p>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Total Biaya / {batchYield} pcs</span>
          </div>

          <div className="kpi-card">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Laba Kotor per Pcs</span>
            <p className="font-heading font-extrabold text-xl text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(labaKotor)}</p>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Harga Jual Rp 5.000 - HPP</span>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                <th className="text-left px-3.5 py-2.5 font-semibold">Bahan Baku</th>
                <th className="text-right px-3.5 py-2.5 font-semibold">Takaran Batch</th>
                <th className="text-right px-3.5 py-2.5 font-semibold">Harga Satuan</th>
                <th className="text-right px-3.5 py-2.5 font-semibold">Subtotal Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {RECIPE_EXAMPLE.map((r) => (
                <tr key={r.material} className="table-row">
                  <td className="px-3.5 py-2.5 font-medium text-neutral-900 dark:text-white">{r.material}</td>
                  <td className="px-3.5 py-2.5 text-right text-neutral-600 dark:text-neutral-400">{r.qty} {r.unit}</td>
                  <td className="px-3.5 py-2.5 text-right text-neutral-600 dark:text-neutral-400">Rp {r.cost}/{r.unit}</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900 dark:text-white">{formatRupiah(r.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials Table */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-heading font-bold text-lg text-neutral-900 dark:text-white">Master Bahan Baku</h2>
          <button className="btn-primary text-xs flex items-center gap-1.5 py-2 shadow-sm">
            <Plus size={15} /> Tambah Bahan
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nama Bahan</th>
                <th className="text-center px-4 py-3 font-semibold">Satuan</th>
                <th className="text-right px-4 py-3 font-semibold">Harga per Satuan</th>
                <th className="text-right px-4 py-3 font-semibold">Stok Saat Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {materials.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">{m.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                      {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">Rp {m.cost_per_unit.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{m.stock_quantity.toLocaleString('id-ID')} {m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
