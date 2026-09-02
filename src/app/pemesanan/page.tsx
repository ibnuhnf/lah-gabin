'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, MessageCircle, Search, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { supabase } from '@/lib/supabase';
import { useStoreConfig } from '@/contexts/StoreContext';
import { formatRupiah } from '@/lib/utils';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { downloadInvoicePDF } from '@/lib/pdf';
import type { Order, OrderItem } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING_APPROVAL: { label: 'Menunggu Konfirmasi', color: 'text-warning-amber bg-amber-50', icon: Clock },
  DITERIMA_PROSES: { label: 'Diterima / Diproses', color: 'text-brand-800 bg-brand-50', icon: Loader2 },
  DIPROSES: { label: 'Sedang Diproses', color: 'text-brand-800 bg-brand-50', icon: Loader2 },
  SELESAI: { label: 'Selesai', color: 'text-success-500 bg-green-50', icon: CheckCircle },
  DIBATALKAN: { label: 'Dibatalkan', color: 'text-danger-500 bg-red-50', icon: XCircle },
};

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const { config } = useStoreConfig();
  const [invoiceInput, setInvoiceInput] = useState(searchParams?.get('kode') || '');
  const [order, setOrder] = useState<(Order & { items?: OrderItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const initialCode = searchParams?.get('kode');

  useEffect(() => {
    if (initialCode) {
      fetchOrder(initialCode);
    }
  }, [initialCode]);

  async function fetchOrder(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('invoice_code', code.trim().toUpperCase())
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder({ ...data, items: data.order_items || [] });
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }

  function handleDownloadPDF() {
    if (!order) return;
    downloadInvoicePDF({
      order,
      bankAccount: config?.bank_account_info || undefined,
    });
  }

  function handleWhatsApp() {
    if (!order || !config) return;
    const url = buildWhatsAppURL(order, config.wa_number);
    window.open(url, '_blank');
  }

  const statusInfo = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_APPROVAL : null;
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="font-heading font-bold text-2xl text-neutral-900 mb-4">
        Status Pesanan
      </h1>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Masukkan kode invoice, mis. LG-20260901-ABCD"
            value={invoiceInput}
            onChange={(e) => setInvoiceInput(e.target.value.toUpperCase())}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            onKeyDown={(e) => e.key === 'Enter' && fetchOrder(invoiceInput)}
          />
        </div>
        <button
          onClick={() => fetchOrder(invoiceInput)}
          disabled={loading || !invoiceInput.trim()}
          className="btn-secondary text-sm py-2"
        >
          {loading ? '...' : 'Cari'}
        </button>
      </div>

      {/* Not Found */}
      {notFound && (
        <div className="card p-8 text-center text-neutral-500 text-sm">
          Pesanan dengan kode <strong>{invoiceInput}</strong> tidak ditemukan.
        </div>
      )}

      {/* Order Found */}
      {order && statusInfo && (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`card p-4 flex items-center gap-3 ${statusInfo.color}`}>
            <StatusIcon size={24} className={order.status === 'DIPROSES' || order.status === 'DITERIMA_PROSES' ? 'animate-spin' : ''} />
            <div>
              <p className="font-heading font-bold text-lg">{statusInfo.label}</p>
              <p className="text-xs opacity-80">{order.invoice_code}</p>
            </div>
          </div>

          {/* Order Detail */}
          <div className="card p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-neutral-500">Pemesan</span><span className="font-medium">{order.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">WhatsApp</span><span className="font-medium">{order.customer_wa}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Tanggal</span><span className="font-medium">{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</span></div>
            {order.customer_notes && (
              <div className="flex justify-between"><span className="text-neutral-500">Catatan</span><span className="font-medium text-right max-w-[60%]">{order.customer_notes}</span></div>
            )}
          </div>

          {/* Items */}
          <div className="card p-4">
            <h3 className="font-heading font-semibold text-sm text-neutral-700 mb-2">Rincian</h3>
            {(order.items || []).map((item, i) => (
              <div key={item.id || i} className="flex justify-between text-sm py-1 border-b border-neutral-100 last:border-0">
                <span className="text-neutral-600 truncate max-w-[60%]">{item.product_name} x{item.quantity}</span>
                <span className="font-medium">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-neutral-200 mt-2 pt-2 space-y-1">
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-success-500">
                  <span>Diskon</span><span>- {formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span><span className="text-accent-500">{formatRupiah(order.final_amount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {order.status === 'PENDING_APPROVAL' && (
            <div className="space-y-2">
              <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800 text-center">
                Pesanan belum final. Kirim konfirmasi ke WhatsApp admin & lampirkan file PDF invoice secara manual.
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  <Download size={16} /> Unduh PDF
                </button>
                <button onClick={handleWhatsApp} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-success-500 text-white text-sm font-bold hover:bg-green-600">
                  <MessageCircle size={16} /> Kirim ke WhatsApp
                </button>
              </div>
            </div>
          )}

          {order.status === 'DIBATALKAN' && order.cancelled_reason && (
            <div className="card p-4 bg-red-50 border-red-200 text-sm text-red-700">
              <strong>Alasan Pembatalan:</strong> {order.cancelled_reason}
            </div>
          )}
        </div>
      )}

      {/* If no order searched yet */}
      {!order && !notFound && !loading && !initialCode && (
        <div className="card p-8 text-center text-neutral-400 text-sm">
          Masukkan kode invoice di atas untuk melacak pesanan kamu.
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          ← Kembali ke Katalog
        </Link>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <CustomerPageWrapper>
      <Suspense fallback={<div className="p-8 text-center text-neutral-400">Memuat...</div>}>
        <OrderTrackingContent />
      </Suspense>
    </CustomerPageWrapper>
  );
}
