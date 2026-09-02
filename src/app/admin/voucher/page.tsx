'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const MOCK_VOUCHERS = [
  { id: '1', code: 'WELCOME10', discount_type: 'PERCENT', discount_value: 10, min_order_amount: 20000, max_discount_amount: 15000, quota_total: 100, quota_used: 12, start_date: '2026-09-01', end_date: '2026-09-30', is_active: true },
  { id: '2', code: 'HEMAT5000', discount_type: 'FIXED', discount_value: 5000, min_order_amount: 25000, max_discount_amount: null, quota_total: 50, quota_used: 38, start_date: '2026-09-01', end_date: '2026-09-15', is_active: true },
  { id: '3', code: 'PROMO20', discount_type: 'PERCENT', discount_value: 20, min_order_amount: 50000, max_discount_amount: 30000, quota_total: 30, quota_used: 30, start_date: '2026-08-01', end_date: '2026-08-31', is_active: false },
];

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'FIXED', discount_value: '', min_order_amount: '', max_discount_amount: '', quota_total: '' });

  const addVoucher = () => {
    if (!form.code || !form.discount_value || !form.quota_total) return;
    setVouchers((prev) => [...prev, {
      id: crypto.randomUUID(),
      code: form.code.toUpperCase(),
      discount_type: form.discount_type as 'FIXED' | 'PERCENT',
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      quota_total: Number(form.quota_total),
      quota_used: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
    }]);
    setShowForm(false);
    setForm({ code: '', discount_type: 'FIXED', discount_value: '', min_order_amount: '', max_discount_amount: '', quota_total: '' });
  };

  const toggleActive = (id: string) => {
    setVouchers((prev) => prev.map((v) => v.id === id ? { ...v, is_active: !v.is_active } : v));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-neutral-900">Voucher</h1>
          <p className="text-sm text-neutral-500">{vouchers.length} voucher.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Tambah Voucher
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-brand-500 space-y-3">
          <h3 className="font-heading font-semibold text-sm">Voucher Baru</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Kode (contoh: DISKON20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-field py-2 text-sm" />
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-field py-2 text-sm">
              <option value="FIXED">Nominal (Rp)</option>
              <option value="PERCENT">Persen (%)</option>
            </select>
            <input type="number" placeholder="Nilai" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-field py-2 text-sm" />
            <input type="number" placeholder="Min. belanja (Rp)" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="input-field py-2 text-sm" />
            <input type="number" placeholder="Maks. diskon (Rp)" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} className="input-field py-2 text-sm" />
            <input type="number" placeholder="Kuota" value={form.quota_total} onChange={(e) => setForm({ ...form, quota_total: e.target.value })} className="input-field py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={addVoucher} className="btn-primary text-sm">Simpan</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-neutral-300 text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Kode</th>
              <th className="text-center px-4 py-3 font-semibold">Tipe</th>
              <th className="text-right px-4 py-3 font-semibold">Nilai</th>
              <th className="text-right px-4 py-3 font-semibold">Min. Belanja</th>
              <th className="text-center px-4 py-3 font-semibold">Kuota</th>
              <th className="text-center px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="table-row">
                <td className="px-4 py-3 font-mono font-bold">{v.code}</td>
                <td className="px-4 py-3 text-center"><span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{v.discount_type === 'FIXED' ? 'Nominal' : 'Persen'}</span></td>
                <td className="px-4 py-3 text-right font-medium">{v.discount_type === 'FIXED' ? `Rp ${v.discount_value.toLocaleString('id-ID')}` : `${v.discount_value}%${v.max_discount_amount ? ` (maks Rp ${v.max_discount_amount.toLocaleString('id-ID')})` : ''}`}</td>
                <td className="px-4 py-3 text-right text-neutral-500">{v.min_order_amount > 0 ? `Rp ${v.min_order_amount.toLocaleString('id-ID')}` : '-'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="w-full bg-neutral-100 rounded-full h-1.5 mb-1">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${(v.quota_used / v.quota_total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-neutral-500">{v.quota_used}/{v.quota_total}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(v.id)} className={`text-xs font-bold px-3 py-1 rounded-full ${v.is_active ? 'badge-ready' : 'bg-neutral-100 text-neutral-500'}`}>
                    {v.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
