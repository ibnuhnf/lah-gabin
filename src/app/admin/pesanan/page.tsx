'use client';

import { useState } from 'react';
import { Check, X, ChevronRight } from 'lucide-react';

const FALLBACK_ORDERS = [
  {
    id: '1',
    invoice_code: 'LG-20260902-A1B2',
    customer_name: 'Budi Santoso',
    customer_wa: '628123456789',
    final_amount: 35000,
    status: 'PENDING_APPROVAL',
    items: [{ product_name: 'Es Gabin Tiramisu', quantity: 5, subtotal: 35000 }],
    created_at: '2026-09-02T10:30:00Z',
  },
  {
    id: '2',
    invoice_code: 'LG-20260902-C3D4',
    customer_name: 'Siti Aminah',
    customer_wa: '628123456780',
    final_amount: 18000,
    status: 'PENDING_APPROVAL',
    items: [{ product_name: 'Es Gabin Oreo', quantity: 3, subtotal: 18000 }],
    created_at: '2026-09-02T11:15:00Z',
  },
  {
    id: '3',
    invoice_code: 'LG-20260901-X9Y8',
    customer_name: 'Andi Wijaya',
    customer_wa: '628123456777',
    final_amount: 22000,
    status: 'DITERIMA_PROSES',
    items: [{ product_name: 'Es Gabin Coklat', quantity: 2, subtotal: 10000 }, { product_name: 'Es Gabin Keju', quantity: 2, subtotal: 11000 }],
    created_at: '2026-09-01T14:20:00Z',
  },
  {
    id: '4',
    invoice_code: 'LG-20260901-W7W6',
    customer_name: 'Dewi Lestari',
    customer_wa: '628123456766',
    final_amount: 12000,
    status: 'SELESAI',
    items: [{ product_name: 'Es Gabin Original', quantity: 3, subtotal: 12000 }],
    created_at: '2026-09-01T09:45:00Z',
  },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'badge-pending',
  DITERIMA_PROSES: 'badge-diproses',
  DIPROSES: 'badge-diproses',
  SELESAI: 'badge-selesai',
  DIBATALKAN: 'badge-dibatalkan',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Menunggu',
  DITERIMA_PROSES: 'Diproses',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Batal',
};

export default function AdminOrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const filtered = FALLBACK_ORDERS.filter((o) => filterStatus === 'all' || o.status === filterStatus);
  const pendingCount = FALLBACK_ORDERS.filter((o) => o.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-neutral-900">Pesanan</h1>
        <p className="text-sm text-neutral-500">
          {pendingCount} pesanan menunggu konfirmasi.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'PENDING_APPROVAL', 'DITERIMA_PROSES', 'SELESAI', 'DIBATALKAN'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
              filterStatus === s
                ? 'bg-brand-900 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {s === 'all' ? 'Semua' : STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Invoice</th>
              <th className="text-left px-4 py-3 font-semibold">Customer</th>
              <th className="text-left px-4 py-3 font-semibold">Items</th>
              <th className="text-right px-4 py-3 font-semibold">Total</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <>
                <tr key={order.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-xs">{order.invoice_code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-900">{order.customer_name}</p>
                    <p className="text-xs text-neutral-400">{order.customer_wa}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">
                    {order.items.length} produk ({order.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-neutral-900">
                    Rp {order.final_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {order.status === 'PENDING_APPROVAL' ? (
                      <div className="flex justify-end gap-1.5">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-success-500 text-white hover:bg-green-600">
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setCancelModal({ id: order.id })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-500 text-white hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="text-brand-700 hover:text-brand-900"
                      >
                        <ChevronRight
                          size={16}
                          className={`transition-transform ${expandedId === order.id ? 'rotate-90' : ''}`}
                        />
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr className="bg-neutral-50">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="text-xs space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.product_name} x{item.quantity}</span>
                            <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-heading font-bold text-lg mb-2">Batalkan Pesanan?</h3>
            <p className="text-sm text-neutral-600 mb-3">Alasan pembatalan (wajib diisi):</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Stok habis, customer tidak bisa bayar, dll."
              className="w-full border border-neutral-300 rounded-xl p-2 text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-300 text-sm"
              >
                Batal
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={() => { setCancelModal(null); setCancelReason(''); }}
                className="flex-1 py-2 rounded-xl bg-danger-500 text-white text-sm disabled:opacity-50"
              >
                Konfirmasi Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
