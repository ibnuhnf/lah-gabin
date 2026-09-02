'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const CATEGORIES = [
  'Bahan Baku',
  'Kemasan / Packaging',
  'Operasional (Gas / Listrik / Air)',
  'Transportasi / Logistik',
  'Marketing / Iklan',
  'Lain-lain',
];

const MOCK_EXPENSES = [
  { id: '1', date: '2026-09-01', category: 'Bahan Baku', amount: 350000, description: 'Beli gabin, susu, keju (mingguan)' },
  { id: '2', date: '2026-09-01', category: 'Kemasan / Packaging', amount: 85000, description: 'Plastik klip 500 pcs + label' },
  { id: '3', date: '2026-08-30', category: 'Operasional (Gas / Listrik / Air)', amount: 250000, description: 'Token listrik + tabung gas' },
  { id: '4', date: '2026-08-29', category: 'Transportasi / Logistik', amount: 45000, description: 'Ongkir kirim raw material' },
  { id: '5', date: '2026-08-25', category: 'Marketing / Iklan', amount: 100000, description: 'Boost IG story 7 hari' },
];

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0], amount: '', description: '' });

  const totalThisMonth = expenses.reduce((s, e) => s + e.amount, 0);

  const addExpense = () => {
    if (!form.amount || !form.description) return;
    setExpenses((prev) => [...prev, {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
    }]);
    setShowForm(false);
    setForm({ category: CATEGORIES[0], amount: '', description: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-neutral-900">Pengeluaran</h1>
          <p className="text-sm text-neutral-500">
            Total periode ini: <strong>{formatRupiah(totalThisMonth)}</strong>
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={16} /> Catat Pengeluaran
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-brand-500">
          <h3 className="font-heading font-semibold text-sm mb-3">Pengeluaran Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Nominal (Rp)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field py-2 text-sm" />
            <input type="text" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field py-2 text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addExpense} className="btn-primary text-sm">Simpan</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-neutral-300 text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
              <th className="text-left px-4 py-3 font-semibold">Kategori</th>
              <th className="text-left px-4 py-3 font-semibold">Deskripsi</th>
              <th className="text-right px-4 py-3 font-semibold">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="table-row">
                <td className="px-4 py-3 text-xs text-neutral-500">{e.date}</td>
                <td className="px-4 py-3"><span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{e.category}</span></td>
                <td className="px-4 py-3 text-neutral-700">{e.description}</td>
                <td className="px-4 py-3 text-right font-bold text-danger-500">- {formatRupiah(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}