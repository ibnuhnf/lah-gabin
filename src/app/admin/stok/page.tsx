'use client';

import { useState } from 'react';
import { Plus, Boxes } from 'lucide-react';

const MOCK_MUTATIONS: {
  id: string;
  item: string;
  type: string;
  qty: number;
  before: number;
  after: number;
  ref: string | null;
  notes: string;
  time: string;
}[] = [];

const TYPE_BADGE: Record<string, string> = {
  MASUK_PEMBELIAN: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60',
  MASUK_PRODUKSI: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60',
  KELUAR_PENJUALAN: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
  WASTE: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60',
  PENYESUAIAN: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60',
};

export default function AdminStockPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Mutasi Stok
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Audit trail pergerakan stok produk dan bahan baku Lah Gabin.
          </p>
        </div>
        <button className="btn-primary text-xs shadow-md">
          <Plus size={16} /> Catat Penyesuaian
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                <th className="text-left px-4 py-3.5 font-semibold">Waktu</th>
                <th className="text-left px-4 py-3.5 font-semibold">Item</th>
                <th className="text-left px-4 py-3.5 font-semibold">Tipe Mutasi</th>
                <th className="text-right px-4 py-3.5 font-semibold">Perubahan</th>
                <th className="text-right px-4 py-3.5 font-semibold">Sebelum</th>
                <th className="text-right px-4 py-3.5 font-semibold">Sesudah</th>
                <th className="text-left px-4 py-3.5 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {MOCK_MUTATIONS.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-4 py-3.5 text-neutral-400 font-mono">{m.time}</td>
                  <td className="px-4 py-3.5 font-bold text-neutral-900 dark:text-white">{m.item}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[m.type] || 'bg-neutral-100'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 text-right font-bold font-heading text-sm ${m.qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.qty > 0 ? `+${m.qty}` : m.qty}
                  </td>
                  <td className="px-4 py-3.5 text-right text-neutral-400">{m.before}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-neutral-900 dark:text-white">{m.after}</td>
                  <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
