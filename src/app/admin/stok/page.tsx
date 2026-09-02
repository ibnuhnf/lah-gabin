'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const MOCK_MUTATIONS = [
  { id: '1', item: 'Es Gabin Coklat', type: 'KELUAR_PENJUALAN', qty: -5, before: 30, after: 25, ref: 'LG-20260902-A1B2', notes: 'ACC Order Online', time: '2026-09-02 10:35' },
  { id: '2', item: 'Es Gabin Keju', type: 'MASUK_PRODUKSI', qty: 20, before: 0, after: 20, ref: 'PROD-001', notes: 'Produksi Batch #1', time: '2026-09-02 08:00' },
  { id: '3', item: 'Susu Kental Manis', type: 'MASUK_PEMBELIAN', qty: 5000, before: 1200, after: 6200, ref: 'PO-2026-08', notes: 'Beli dari Grosir', time: '2026-09-01 16:20' },
  { id: '4', item: 'Es Gabin Strawberry', type: 'WASTE', qty: -2, before: 20, after: 18, ref: null, notes: 'Gabin hancur / cacat', time: '2026-09-01 12:00' },
];

const TYPE_BADGE: Record<string, string> = {
  MASUK_PEMBELIAN: 'bg-green-100 text-green-800',
  MASUK_PRODUKSI: 'bg-blue-100 text-blue-800',
  KELUAR_PENJUALAN: 'bg-amber-100 text-amber-800',
  WASTE: 'bg-red-100 text-red-800',
  PENYESUAIAN: 'bg-purple-100 text-purple-800',
};

export default function AdminStockPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-neutral-900">Mutasi Stok</h1>
          <p className="text-sm text-neutral-500">Ledger audit trail pergerakan stok produk dan bahan baku.</p>
        </div>
        <button className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={16} /> Catat Penyesuaian
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Waktu</th>
              <th className="text-left px-4 py-3 font-semibold">Item</th>
              <th className="text-left px-4 py-3 font-semibold">Tipe Mutasi</th>
              <th className="text-right px-4 py-3 font-semibold">Perubahan</th>
              <th className="text-right px-4 py-3 font-semibold">Sebelum</th>
              <th className="text-right px-4 py-3 font-semibold">Sesudah</th>
              <th className="text-left px-4 py-3 font-semibold">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MUTATIONS.map((m) => (
              <tr key={m.id} className="table-row">
                <td className="px-4 py-3 text-xs text-neutral-400">{m.time}</td>
                <td className="px-4 py-3 font-semibold">{m.item}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[m.type] || 'bg-neutral-100'}`}>
                    {m.type}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-bold ${m.qty > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                </td>
                <td className="px-4 py-3 text-right text-neutral-500">{m.before}</td>
                <td className="px-4 py-3 text-right font-semibold">{m.after}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{m.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
