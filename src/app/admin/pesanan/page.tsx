'use client';

import { useState, useEffect } from 'react';
import { Check, X, ChevronRight, MessageCircle, Clock, CheckCircle2, XCircle, MapPin, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';

import type { Order } from '@/types';

// Reset: daftar pesanan riwayat kosong
const FALLBACK_ORDERS: Order[] = [];

const STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'badge-pending',
  DITERIMA_PROSES: 'badge-diproses',
  DIPROSES: 'badge-diproses',
  SELESAI: 'badge-selesai',
  DIBATALKAN: 'badge-dibatalkan',
};

import { fetchAllOrders, updateOrderStatus, deleteOrderPermanently } from '@/lib/orderStore';
import { createCashTransaction } from '@/lib/cashbookStore';

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Menunggu Konfirmasi',
  DITERIMA_PROSES: 'Diproses',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancelModal, setCancelModal] = useState<{ id: string; name: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string; invoice: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchOrders = async () => {
    const list = await fetchAllOrders();
    setOrders(list);
  };

  useEffect(() => {
    fetchOrders();

    // 1. Polling setiap 5 detik untuk mendeteksi order baru dari device lain (HP customer)
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    // 2. Real-time Supabase postgres_changes channel
    let channel: any = null;
    if (isSupabaseConfigured()) {
      try {
        channel = supabase
          .channel('realtime_orders_admin_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              fetchOrders();
            }
          )
          .subscribe();
      } catch {}
    }

    return () => {
      clearInterval(interval);
      if (channel && isSupabaseConfigured()) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  const approveOrder = async (id: string) => {
    await updateOrderStatus(id, 'DITERIMA_PROSES');
    await fetchOrders();
    setNotification('Pesanan berhasil diterima dan diproses!');
    setTimeout(() => setNotification(null), 3000);
  };

  const markCompleted = async (id: string) => {
    const targetOrder = orders.find((o) => o.id === id);
    await updateOrderStatus(id, 'SELESAI');

    // Auto-bridge: catat kas masuk di Buku Kas Supabase (kecuali POS)
    if (targetOrder && targetOrder.order_source !== 'POS') {
      try {
        await createCashTransaction({
          type: 'IN',
          amount: Number(targetOrder.final_amount) || 0,
          category: 'PENJUALAN_ONLINE',
          description: `Penjualan Online ${targetOrder.invoice_code}${targetOrder.customer_name ? ` - ${targetOrder.customer_name}` : ''}`,
        });
      } catch {}
    }

    await fetchOrders();
    setNotification('Pesanan ditandai selesai!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return;

    await updateOrderStatus(cancelModal.id, 'DIBATALKAN', cancelReason.trim());
    await fetchOrders();
    setCancelModal(null);
    setCancelReason('');
    setNotification('Pesanan berhasil dibatalkan.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;

    await deleteOrderPermanently(deleteModal.id, deleteModal.invoice);
    await fetchOrders();
    setDeleteModal(null);
    setNotification('Pesanan berhasil dihapus.');
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = orders.filter((o) => filterStatus === 'all' || o.status === filterStatus);
  const pendingCount = orders.filter((o) => o.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={16} />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Pesanan Masuk
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            {pendingCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                ● {pendingCount} pesanan baru menunggu konfirmasi
              </span>
            ) : (
              'Semua pesanan terkendali.'
            )}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/70 dark:bg-neutral-800/80 p-1.5 rounded-2xl gap-1 overflow-x-auto border border-slate-300/40 dark:border-neutral-700/60">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'PENDING_APPROVAL', label: `Menunggu (${pendingCount})` },
          { key: 'DITERIMA_PROSES', label: 'Diproses' },
          { key: 'SELESAI', label: 'Selesai' },
          { key: 'DIBATALKAN', label: 'Dibatalkan' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              filterStatus === s.key
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-white shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="text-left px-5 py-3.5 font-bold">Invoice & Waktu</th>
                <th className="text-left px-4 py-3.5 font-bold">Customer & Alamat</th>
                <th className="text-left px-4 py-3.5 font-bold">Items</th>
                <th className="text-right px-4 py-3.5 font-bold">Total</th>
                <th className="text-left px-4 py-3.5 font-bold">Status</th>
                <th className="text-right px-5 py-3.5 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((order) => {
                const waClean = (order.customer_wa || '').replace(/\D/g, '');
                const waLink = `https://wa.me/${waClean}?text=${encodeURIComponent(
                  `Halo Kak ${order.customer_name}, pesanan ${order.invoice_code} di Lah Gabin sudah kami terima dan segera diproses!`
                )}`;

                return (
                  <tr key={order.id} className="table-row">
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                        {order.invoice_code}
                      </p>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock size={11} />
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-neutral-900 dark:text-white">
                        {order.customer_name}
                      </p>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5"
                      >
                        <MessageCircle size={12} />
                        {order.customer_wa}
                      </a>
                      {order.customer_address && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1 font-medium max-w-xs">
                          <MapPin size={11} className="shrink-0 text-blue-500" />
                          <span className="truncate">{order.customer_address}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                      {(order.items || []).map((it, idx) => (
                        <div key={idx}>
                          {it.product_name} <span className="font-bold text-blue-600 dark:text-blue-400">x{it.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-neutral-900 dark:text-white font-heading">
                      {formatRupiah(order.final_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={STATUS_BADGE[order.status] || 'badge-pending'}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      {order.cancellation_reason && (
                        <p className="text-[11px] text-rose-500 mt-1 italic font-medium">
                          Alasan: {order.cancellation_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {order.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => approveOrder(order.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                              title="Terima dan Proses Pesanan"
                            >
                              <Check size={14} /> Terima
                            </button>
                            <button
                              onClick={() => setCancelModal({ id: order.id, name: order.customer_name })}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                              title="Batalkan Pesanan"
                            >
                              <X size={14} /> Tolak
                            </button>
                          </>
                        )}
                        {order.status === 'DITERIMA_PROSES' && (
                          <button
                            onClick={() => markCompleted(order.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <CheckCircle2 size={14} /> Selesai
                          </button>
                        )}
                        {order.status === 'SELESAI' && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ Lunas
                          </span>
                        )}
                        <button
                          onClick={() => setDeleteModal({ id: order.id, name: order.customer_name, invoice: order.invoice_code })}
                          className="p-1.5 rounded-xl bg-neutral-100 hover:bg-rose-100 dark:bg-neutral-800 dark:hover:bg-rose-950/50 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
                          title="Hapus Pesanan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-900 dark:text-white mb-1">
              Hapus Pesanan?
            </h3>
            <p className="text-xs text-neutral-500 mb-4 font-medium leading-relaxed">
              Pesanan <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{deleteModal.invoice}</span> atas nama <strong>{deleteModal.name}</strong> akan dihapus permanen dari daftar dan riwayat.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-bold text-lg text-neutral-900 dark:text-white mb-1">
              Batalkan Pesanan Customer?
            </h3>
            <p className="text-xs text-neutral-500 mb-4 font-medium">
              Customer: <strong>{cancelModal.name}</strong>. Tuliskan alasan pembatalan:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Stok bahan baku habis mendadak, permintaan customer, dll."
              className="input-field resize-none mb-4 font-medium"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason('');
                }}
                className="flex-1 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md disabled:opacity-50"
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
