'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { formatRupiah } from '@/lib/utils';
import { validateVoucher, consumeVoucherQuota, generateInvoiceCode } from '@/lib/orders';
import { normalizeIndonesianPhone, isValidIndonesianPhone } from '@/lib/whatsapp';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Voucher } from '@/types';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { config } = useStoreConfig();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ voucher: Voucher; discount: number } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isPending, startTransition] = useTransition();

  const discountAmount = appliedVoucher?.discount ?? 0;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  async function handleApplyVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherMsg('');
    const result = await validateVoucher(voucherCode, subtotal);
    setVoucherLoading(false);
    if (result.valid && result.voucher) {
      setAppliedVoucher({ voucher: result.voucher, discount: result.discount_amount });
      setVoucherMsg(result.message);
    } else {
      setAppliedVoucher(null);
      setVoucherMsg(result.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama pemesan wajib diisi.');
      return;
    }
    if (!isValidIndonesianPhone(phone)) {
      setFormError('Nomor WhatsApp tidak valid (format 08xx atau +62xx).');
      return;
    }
    if (items.length === 0) {
      setFormError('Keranjang belanja kosong.');
      return;
    }

    startTransition(async () => {
      try {
        const invoiceCode = generateInvoiceCode();
        const normalizedPhone = normalizeIndonesianPhone(phone);
        const orderId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const orderData = {
          id: orderId,
          invoice_code: invoiceCode,
          customer_name: name.trim(),
          customer_wa: normalizedPhone,
          customer_notes: notes.trim() || null,
          total_amount: subtotal,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          payment_method: 'QRIS' as const,
          status: 'PENDING_APPROVAL' as const,
          voucher_id: appliedVoucher?.voucher.id || null,
          order_source: 'ONLINE' as const,
          created_at: createdAt,
        };

        const orderItemsData = items.map((item) => ({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: item.product.id,
          product_name: item.product.name,
          price_snapshot: item.activePrice,
          quantity: item.quantity,
          subtotal: item.activePrice * item.quantity,
          created_at: createdAt,
        }));

        // Always save to local cache for instant resilience
        try {
          const fullOrder = { ...orderData, items: orderItemsData, order_items: orderItemsData };
          localStorage.setItem(`lah_gabin_order_${invoiceCode}`, JSON.stringify(fullOrder));

          const existingAdminOrders = JSON.parse(localStorage.getItem('lah_gabin_admin_orders') || '[]');
          localStorage.setItem(
            'lah_gabin_admin_orders',
            JSON.stringify([fullOrder, ...existingAdminOrders])
          );
        } catch {}

        // Persist to Supabase if configured
        if (isSupabaseConfigured()) {
          try {
            const { data: dbOrder, error: orderError } = await supabase
              .from('orders')
              .insert([orderData])
              .select()
              .maybeSingle();

            if (!orderError && dbOrder) {
              await supabase.from('order_items').insert(orderItemsData);
            }
          } catch (err) {
            console.warn('Supabase order insert fallback to local:', err);
          }
        }

        if (appliedVoucher) {
          try {
            await consumeVoucherQuota(appliedVoucher.voucher.id);
          } catch {}
        }

        clearCart();
        router.push(`/pemesanan?kode=${invoiceCode}&wa=${normalizedPhone}`);
      } catch (err) {
        console.error('Checkout error:', err);
        setFormError('Terjadi kesalahan teknis. Silakan coba kembali.');
      }
    });
  }

  if (items.length === 0 && !isPending) {
    return (
      <CustomerPageWrapper>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-sm">
            Keranjang belanja masih kosong.
          </p>
          <Link href="/" className="btn-primary inline-flex text-sm">
            Kembali ke Menu
          </Link>
        </div>
      </CustomerPageWrapper>
    );
  }

  return (
    <CustomerPageWrapper>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/keranjang"
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-heading font-bold text-xl text-neutral-900 dark:text-white">
            Konfirmasi Pesanan
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary Card */}
          <div className="card p-4">
            <h2 className="font-heading font-semibold text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Ringkasan Pesanan
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between items-center text-sm py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white text-xs w-6 text-center py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                      {item.quantity}x
                    </span>
                    <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                      {item.product.name}
                    </span>
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {formatRupiah(item.activePrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Data */}
          <div className="card p-4 space-y-3.5">
            <h2 className="font-heading font-semibold text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Data Pemesan
            </h2>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                placeholder="0812xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Digunakan untuk konfirmasi pesanan dan bukti transaksi.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Catatan Khusus (opsional)
              </label>
              <textarea
                placeholder="Contoh: Titip di pos satpam, request sendok, dll."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Voucher */}
          <div className="card p-4">
            <h2 className="font-heading font-semibold text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tag size={13} /> Kupon / Voucher
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="KODE VOUCHER"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="input-field font-mono uppercase text-xs flex-1"
                disabled={!!appliedVoucher}
              />
              {appliedVoucher ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedVoucher(null);
                    setVoucherMsg('');
                    setVoucherCode('');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300"
                >
                  Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={voucherLoading || !voucherCode.trim()}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {voucherLoading ? 'Memeriksa...' : 'Gunakan'}
                </button>
              )}
            </div>
            {voucherMsg && (
              <p
                className={`text-xs mt-2 ${
                  appliedVoucher ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500'
                }`}
              >
                {voucherMsg}
              </p>
            )}
          </div>

          {/* Payment & Total */}
          <div className="card p-4 space-y-2">
            <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <span>Subtotal</span>
              <span className="font-medium text-neutral-900 dark:text-white">{formatRupiah(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Diskon Kupon</span>
                <span>- {formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-heading font-bold text-base border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-2">
              <span className="text-neutral-900 dark:text-white">Total Pembayaran</span>
              <span className="text-accent-500 font-extrabold text-lg">{formatRupiah(finalAmount)}</span>
            </div>
          </div>

          {formError && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs p-3 rounded-2xl text-center font-medium">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-primary text-sm py-3 font-semibold shadow-md"
          >
            {isPending ? 'Memproses Pesanan...' : 'Kirim Pesanan Sekarang'}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 text-center pt-1">
            <ShieldCheck size={13} />
            <span>Transaksi aman & langsung terhubung ke WhatsApp Admin</span>
          </div>
        </form>
      </div>
    </CustomerPageWrapper>
  );
}
