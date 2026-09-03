'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, MessageCircle, Search, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useStoreConfig } from '@/contexts/StoreContext';
import { formatRupiah } from '@/lib/utils';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { downloadInvoicePDF } from '@/lib/pdf';
import type { Order, OrderItem } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING_APPROVAL: {
    label: 'Menunggu Konfirmasi',
    color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    icon: Clock,
  },
  DITERIMA_PROSES: {
    label: 'Pesanan Diproses',
    color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    icon: Loader2,
  },
  DIPROSES: {
    label: 'Pesanan Diproses',
    color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    icon: Loader2,
  },
  SELESAI: {
    label: 'Pesanan Selesai',
    color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  DIBATALKAN: {
    label: 'Pesanan Dibatalkan',
    color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
    icon: XCircle,
  },
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
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    // 1. Check local cache first
    try {
      const cached = localStorage.getItem(`lah_gabin_order_${cleanCode}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setOrder(parsed);
      }
    } catch {}

    // 2. Fetch from Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('invoice_code', cleanCode)
          .maybeSingle();

        if (!error && data) {
          setOrder({ ...data, items: data.order_items || [] });
          try {
            localStorage.setItem(`lah_gabin_order_${cleanCode}`, JSON.stringify({ ...data, items: data.order_items || [] }));
          } catch {}
        }
      } catch (err) {
        console.warn('Supabase fetch error:', err);
      }
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
    if (!order) return;
    const adminNumber = config?.wa_number || '6282121498255';
    const url = buildWhatsAppURL(order, adminNumber);
    window.open(url, '_blank');
  }

  const statusInfo = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_APPROVAL : null;
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-heading font-extrabold text-xl text-neutral-900 dark:text-white">
          Lacak Pesanan
        </h1>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Masukkan kode invoice (mis. LG-20260901-ABCD)"
            value={invoiceInput}
            onChange={(e) => setInvoiceInput(e.target.value.toUpperCase())}
            className="input-field pl-9 font-mono uppercase text-xs font-bold"
            onKeyDown={(e) => e.key === 'Enter' && fetchOrder(invoiceInput)}
          />
        </div>
        <button
          onClick={() => fetchOrder(invoiceInput)}
          disabled={loading || !invoiceInput.trim()}
          className="btn-primary text-xs px-5"
        >
          {loading ? 'Mencari...' : 'Lacak'}
        </button>
      </div>

      {/* Not Found */}
      {notFound && !order && (
        <div className="card p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm font-medium">
          Pesanan dengan kode <strong>{invoiceInput}</strong> tidak ditemukan.
        </div>
      )}

      {/* Order Found */}
      {order && statusInfo && (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`p-4 rounded-3xl border flex items-center gap-3.5 ${statusInfo.color}`}>
            <StatusIcon
              size={22}
              className={order.status === 'DIPROSES' || order.status === 'DITERIMA_PROSES' ? 'animate-spin' : ''}
            />
            <div>
              <p className="font-heading font-bold text-base">{statusInfo.label}</p>
              <p className="text-xs font-mono font-bold opacity-90">{order.invoice_code}</p>
            </div>
          </div>

          {/* Order Detail */}
          <div className="card p-4 text-sm space-y-2.5">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Pemesan</span>
              <span className="font-bold text-neutral-900 dark:text-white text-xs">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">WhatsApp</span>
              <span className="font-bold text-neutral-900 dark:text-white text-xs">{order.customer_wa}</span>
            </div>
            {order.customer_address && (
              <div className="flex justify-between items-start">
                <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium flex items-center gap-1">
                  <MapPin size={12} /> Alamat
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white text-xs text-right max-w-[65%]">
                  {order.customer_address}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Waktu Pemesanan</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">
                {new Date(order.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {order.customer_notes && (
              <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
                <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Catatan</span>
                <span className="text-xs text-neutral-800 dark:text-neutral-200 text-right max-w-[65%] font-medium">
                  {order.customer_notes}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="card p-4">
            <h3 className="font-heading font-bold text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2.5">
              Rincian Produk
            </h3>
            <div className="space-y-1.5">
              {(order.items || []).map((item, i) => (
                <div
                  key={item.id || i}
                  className="flex justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                    {item.product_name} <span className="text-neutral-400 font-normal">x{item.quantity}</span>
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 mt-3 pt-2.5 space-y-1">
              {order.delivery_fee ? (
                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  <span>Ongkir</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{formatRupiah(order.delivery_fee)}</span>
                </div>
              ) : null}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Diskon Kupon</span>
                  <span>- {formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading font-bold text-sm text-neutral-900 dark:text-white pt-1">
                <span>Total Pembayaran</span>
                <span className="text-blue-600 font-extrabold">{formatRupiah(order.final_amount)}</span>
              </div>
            </div>
          </div>

          {/* Actions for Customer */}
          {order.status === 'PENDING_APPROVAL' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 text-center font-semibold">
                Kirim konfirmasi ke WhatsApp admin untuk memproses pesanan dan verifikasi pembayaran.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Download size={15} /> Unduh PDF
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <MessageCircle size={15} /> Kirim ke WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!order && !notFound && !loading && !initialCode && (
        <div className="card p-8 text-center text-neutral-400 text-xs font-medium">
          Masukkan kode invoice yang tertera di bukti pemesanan untuk melihat status pesanan.
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <CustomerPageWrapper>
      <Suspense fallback={<div className="p-8 text-center text-neutral-400 text-sm">Memuat data...</div>}>
        <OrderTrackingContent />
      </Suspense>
    </CustomerPageWrapper>
  );
}
