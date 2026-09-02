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
  const [selectedProduct, setSelectedProduct] = useState('Es Gabin Coklat');

  const totalBatchCost = RECIPE_EXAMPLE.reduce((s, i) => s + i.subtotal, 0);
  const batchYield = 20;
  const hppPerPcs = Math.round(totalBatchCost / batchYield);
  const basePrice = 5000;
  const labaKotor = basePrice - hppPerPcs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-neutral-900">Bahan Baku & Engine HPP</h1>
        <p className="text-sm text-neutral-500">Master harga bahan baku dan kalkulasi HPP otomatis berbasis resep batch.</p>
      </div>

      {/* HPP Engine Live Simulator */}
      <div className="card p-5 border-2 border-brand-500 bg-brand-50/20">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={20} className="text-brand-800" />
          <h2 className="font-heading font-bold text-base text-brand-900">Simulasi Resep & HPP</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="kpi-card bg-white">
            <span className="text-xs text-neutral-500">Total Biaya per Batch</span>
            <p className="font-heading font-bold text-lg text-brand-900">{formatRupiah(totalBatchCost)}</p>
            <span className="text-[10px] text-neutral-400">untuk {batchYield} pcs produk</span>
          </div>

          <div className="kpi-card bg-white">
            <span className="text-xs text-neutral-500">HPP per Pcs</span>
            <p className="font-heading font-bold text-lg text-accent-500">{formatRupiah(hppPerPcs)}</p>
            <span className="text-[10px] text-neutral-400">Total Biaya / {batchYield} pcs</span>
          </div>

          <div className="kpi-card bg-white">
            <span className="text-xs text-neutral-500">Laba Kotor per Pcs</span>
            <p className="font-heading font-bold text-lg text-success-500">{formatRupiah(labaKotor)}</p>
            <span className="text-[10px] text-neutral-400">Harga Jual Rp 5.000 - HPP</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Bahan Baku</th>
                <th className="text-right px-3 py-2 font-semibold">Takaran Batch</th>
                <th className="text-right px-3 py-2 font-semibold">Harga Satuan</th>
                <th className="text-right px-3 py-2 font-semibold">Subtotal Biaya</th>
              </tr>
            </thead>
            <tbody>
              {RECIPE_EXAMPLE.map((r) => (
                <tr key={r.material} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2 font-medium">{r.material}</td>
                  <td className="px-3 py-2 text-right text-neutral-600">{r.qty} {r.unit}</td>
                  <td className="px-3 py-2 text-right text-neutral-600">Rp {r.cost}/{r.unit}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatRupiah(r.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials Table */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-heading font-bold text-lg text-neutral-900">Master Bahan Baku</h2>
          <button className="btn-primary text-sm flex items-center gap-1.5 py-2">
            <Plus size={16} /> Tambah Bahan
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nama Bahan</th>
                <th className="text-center px-4 py-3 font-semibold">Satuan</th>
                <th className="text-right px-4 py-3 font-semibold">Harga per Satuan</th>
                <th className="text-right px-4 py-3 font-semibold">Stok Saat Ini</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-4 py-3 font-semibold">{m.name}</td>
                  <td className="px-4 py-3 text-center"><span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{m.unit}</span></td>
                  <td className="px-4 py-3 text-right font-medium">Rp {m.cost_per_unit.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{m.stock_quantity.toLocaleString('id-ID')} {m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
