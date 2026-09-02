'use client';

import { formatRupiah } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'IN', amount: 35000, category: 'PENJUALAN_ONLINE', description: 'Penjualan LG-20260902-A1B2', time: '2026-09-02 10:35' },
  { id: '2', type: 'IN', amount: 22000, category: 'PENJUALAN_POS', description: 'Transaksi Kasir Walk-in', time: '2026-09-02 09:15' },
  { id: '3', type: 'OUT', amount: 350000, category: 'BAHAN_BAKU', description: 'Pembelian bahan baku mingguan', time: '2026-09-01 16:00' },
  { id: '4', type: 'IN', amount: 18000, category: 'PENJUALAN_ONLINE', description: 'Penjualan LG-20260902-C3D4', time: '2026-09-01 14:45' },
  { id: '5', type: 'OUT', amount: 85000, category: 'KEMASAN', description: 'Pembelian plastik klip + label', time: '2026-09-01 12:30' },
];

const initSaldo = 1850000;
const totalIn = MOCK_TRANSACTIONS.filter((t) => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
const totalOut = MOCK_TRANSACTIONS.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
const saldoKas = initSaldo + totalIn - totalOut;

export default function AdminCashPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading font-bold text-2xl text-neutral-900">Buku Kas</h1>
        <p className="text-sm text-neutral-500">Saldo = Kas Awal + Total Masuk − Total Keluar</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="text-xs text-neutral-500">Total Masuk</span>
          <p className="font-heading font-bold text-lg text-success-500">{formatRupiah(totalIn)}</p>
        </div>
        <div className="kpi-card">
          <span className="text-xs text-neutral-500">Total Keluar</span>
          <p className="font-heading font-bold text-lg text-danger-500">{formatRupiah(totalOut)}</p>
        </div>
        <div className="kpi-card border-2 border-brand-500">
          <span className="text-xs text-neutral-500">Saldo Kas</span>
          <p className="font-heading font-bold text-lg text-brand-900">{formatRupiah(saldoKas)}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Waktu</th>
              <th className="text-center px-4 py-3 font-semibold">Tipe</th>
              <th className="text-left px-4 py-3 font-semibold">Deskripsi</th>
              <th className="text-right px-4 py-3 font-semibold">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRANSACTIONS.map((t) => (
              <tr key={t.id} className="table-row">
                <td className="px-4 py-3 text-xs text-neutral-400">{t.time}</td>
                <td className="px-4 py-3 text-center">
                  {t.type === 'IN' ? (
                    <span className="inline-flex items-center gap-0.5 text-success-500 text-xs font-bold"><ArrowUpRight size={12} />Masuk</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-danger-500 text-xs font-bold"><ArrowDownRight size={12} />Keluar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-700">{t.description}</td>
                <td className={`px-4 py-3 text-right font-bold ${t.type === 'IN' ? 'text-success-500' : 'text-danger-500'}`}>
                  {t.type === 'IN' ? '+' : '-'} {formatRupiah(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
