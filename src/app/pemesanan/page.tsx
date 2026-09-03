'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, MessageCircle, Search, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, MapPin, Phone } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useStoreConfig } from '@/contexts/StoreContext';
import { formatRupiah } from '@/lib/utils';
import { buildWhatsAppURL, normalizeIndonesianPhone } from '@/lib/whatsapp';
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
  const [searchInput, setSearchInput] = useState(
    searchParams?.get('kode') || searchParams?.get('wa') || ''
  );
  const [matchedOrders, setMatchedOrders] = useState<(Order & { items?: OrderItem[] })[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items?: OrderItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const initialCode = searchParams?.get('kode') || searchParams?.get('wa');

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  async function handleSearch(term: string) {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    setLoading(true);
    setNotFound(false);
    setSelectedOrder(null);
    setMatchedOrders([]);

    const cleanInvoice = cleanTerm.toUpperCase();
    const cleanPhone = normalizeIndonesianPhone(cleanTerm);

    let allOrders: (Order & { items?: OrderItem[] })[] = [];

    // 1. Gather all local admin orders & specific single cache
    try {
      const adminOrdersRaw = localStorage.getItem('lah_gabin_admin_orders');
      if (adminOrdersRaw) {
        const parsed: (Order & { items?: OrderItem[] })[] = JSON.parse(adminOrdersRaw);
        allOrders = [...parsed];
      }
      const singleOrderRaw = localStorage.getItem(`lah_gabin_order_${cleanInvoice}`);
      if (singleOrderRaw) {
        const single = JSON.parse(singleOrderRaw);
        if (!allOrders.some((o) => o.invoice_code === single.invoice_code)) {
          allOrders.unshift(single);
        }
      }
    } catch {}

    // 2. Fetch from Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`invoice_code.ilike.%${cleanInvoice}%,customer_wa.ilike.%${cleanPhone}%`)
          .order('created_at', { ascending: false });

        if (!error && dbOrders && dbOrders.length > 0) {
          const formatted = dbOrders.map((o) => ({ ...o, items: o.order_items || o.items || [] }));
          // Merge with priority on Supabase data
          formatted.forEach((f) => {
            const idx = allOrders.findIndex((item) => item.invoice_code === f.invoice_code);
            if (idx >= 0) {
              allOrders[idx] = f;
            } else {
              allOrders.push(f);
            }
          });
        }
      } catch (err) {
        console.warn('Supabase fetch error:', err);
      }
    }

    // Filter matched orders
    const matched = allOrders.filter((o) => {
      const matchInvoice = o.invoice_code?.toUpperCase() === cleanInvoice || o.invoice_code?.toUpperCase().includes(cleanInvoice);
      const matchWa = normalizeIndonesianPhone(o.customer_wa || '').includes(cleanPhone) || (o.customer_wa || '').includes(cleanTerm);
      return matchInvoice || matchWa;
    });

    if (matched.length === 1) {
      setSelectedOrder(matched[0]);
      setMatchedOrders([]);
    } else if (matched.length > 1) {
      setMatchedOrders(matched);
      setSelectedOrder(matched[0]);
    } else {
      setNotFound(true);
    }

    setLoading(false);
  }

  function handleDownloadPDF(order: Order) {
    downloadInvoicePDF({
      order,
      bankAccount: config?.bank_account_info || undefined,
    });
  }

  function handleWhatsApp(order: Order) {
    const adminNumber = config?.wa_number || '6282121498255';
    const url = buildWhatsAppURL(order, adminNumber);
    window.open(url, '_blank');
  }

  const currentOrder = selectedOrder;
  const statusInfo = currentOrder ? STATUS_CONFIG[currentOrder.status] || STATUS_CONFIG.PENDING_APPROVAL : null;
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

      {/* Search Bar (Kode Invoice OR Nomor WhatsApp) */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Masukkan Kode Invoice atau No. WhatsApp"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field !pl-10 font-medium text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
          />
        </div>
        <button
          onClick={() => handleSearch(searchInput)}
          disabled={loading || !searchInput.trim()}
          className="btn-primary text-xs px-5 font-bold"
        >
          {loading ? 'Mencari...' : 'Lacak'}
        </button>
      </div>

      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-6 font-medium">
        Bisa cari menggunakan <strong>Kode Invoice (LG-...)</strong> atau <strong>Nomor WhatsApp (08xx)</strong> saat memesan.
      </p>

      {/* Multiple Orders Selector if phone returns more than 1 order */}
      {matchedOrders.length > 1 && (
        <div className="card p-3 mb-5 space-y-2">
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Ditemukan {matchedOrders.length} Pesanan:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {matchedOrders.map((ord) => (
              <button
                key={ord.id || ord.invoice_code}
                onClick={() => setSelectedOrder(ord)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedOrder?.invoice_code === ord.invoice_code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {ord.invoice_code} ({STATUS_CONFIG[ord.status]?.label || ord.status})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not Found */}
      {notFound && !currentOrder && (
        <div className="card p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm font-medium">
          Pesanan dengan kata kunci <strong>{searchInput}</strong> tidak ditemukan. Pastikan kode invoice atau nomor WhatsApp sudah benar.
        </div>
      )}

      {/* Order Found */}
      {currentOrder && statusInfo && (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`p-4 rounded-3xl border flex items-center gap-3.5 ${statusInfo.color}`}>
            <StatusIcon
              size={22}
              className={currentOrder.status === 'DIPROSES' || currentOrder.status === 'DITERIMA_PROSES' ? 'animate-spin' : ''}
            />
            <div>
              <p className="font-heading font-bold text-base">{statusInfo.label}</p>
              <p className="text-xs font-mono font-bold opacity-90">{currentOrder.invoice_code}</p>
            </div>
          </div>

          {/* Order Detail */}
          <div className="card p-4 text-sm space-y-2.5">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Pemesan</span>
              <span className="font-bold text-neutral-900 dark:text-white text-xs">{currentOrder.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">WhatsApp</span>
              <span className="font-bold text-neutral-900 dark:text-white text-xs">{currentOrder.customer_wa}</span>
            </div>
            {currentOrder.customer_address && (
              <div className="flex justify-between items-start">
                <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium flex items-center gap-1 shrink-0">
                  <MapPin size={12} /> Alamat
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white text-xs text-right max-w-[65%]">
                  {currentOrder.customer_address}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Waktu Pemesanan</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">
                {new Date(currentOrder.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {currentOrder.customer_notes && (
              <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
                <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Catatan</span>
                <span className="text-xs text-neutral-800 dark:text-neutral-200 text-right max-w-[65%] font-medium">
                  {currentOrder.customer_notes}
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
              {(currentOrder.items || []).map((item, i) => (
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
              {currentOrder.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Diskon Kupon</span>
                  <span>- {formatRupiah(currentOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading font-bold text-sm text-neutral-900 dark:text-white pt-1">
                <span>Total Pembayaran</span>
                <span className="text-blue-600 font-extrabold">{formatRupiah(currentOrder.final_amount)}</span>
              </div>
            </div>
          </div>

          {/* Actions for Customer */}
          {currentOrder.status === 'PENDING_APPROVAL' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 text-center font-semibold">
                Kirim konfirmasi ke WhatsApp admin untuk memproses pesanan dan verifikasi pembayaran.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPDF(currentOrder)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Download size={15} /> Unduh PDF
                </button>
                <button
                  onClick={() => handleWhatsApp(currentOrder)}
                  className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <MessageCircle size={15} /> Kirim ke WhatsApp
                </button>
              </div>
            </div>
          )}

          {currentOrder.status === 'SELESAI' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 text-center font-bold">
              Pesanan ini telah selesai dan lunas. Selamat menikmati Lah Gabin!
            </div>
          )}
        </div>
      )}

      {!currentOrder && !notFound && !loading && !initialCode && (
        <div className="card p-8 text-center text-neutral-400 text-xs font-medium">
          Masukkan kode invoice atau nomor WhatsApp Anda untuk melihat status pesanan realtime.
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
