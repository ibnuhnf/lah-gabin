'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { formatRupiah } from '@/lib/utils';
import { validateVoucher, consumeVoucherQuota, generateInvoiceCode } from '@/lib/orders';
import { normalizeIndonesianPhone, isValidIndonesianPhone } from '@/lib/whatsapp';
import { getSupabase } from '@/lib/supabase';
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

    if (!name.trim()) { setFormError('Nama wajib diisi.'); return; }
    if (!isValidIndonesianPhone(phone)) { setFormError('Nomor WhatsApp tidak valid (format Indonesia).'); return; }
    if (items.length === 0) { setFormError('Keranjang kosong.'); return; }
    if (!config?.is_open) { setFormError('Toko sedang tutup, pesanan tidak bisa dibuat.'); return; }

    startTransition(async () => {
      try {
        const invoiceCode = generateInvoiceCode();
        const normalizedPhone = normalizeIndonesianPhone(phone);

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            invoice_code: invoiceCode,
            customer_name: name.trim(),
            customer_wa: normalizedPhone,
            customer_notes: notes.trim() || null,
            total_amount: subtotal,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            payment_method: 'QRIS',
            status: 'PENDING_APPROVAL',
            voucher_id: appliedVoucher?.voucher.id || null,
            order_source: 'ONLINE',
          })
          .select()
          .single();

        if (orderError || !order) {
          setFormError('Gagal membuat pesanan. Coba lagi.');
          return;
        }

        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          price_snapshot: item.activePrice,
          quantity: item.quantity,
          subtotal: item.activePrice * item.quantity,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
          await supabase.from('orders').delete().eq('id', order.id);
          setFormError('Gagal menyimpan item pesanan. Coba lagi.');
          return;
        }

        if (appliedVoucher) {
          await consumeVoucherQuota(appliedVoucher.voucher.id);
        }

        clearCart();
        router.push(`/pemesanan?kode=${invoiceCode}&wa=${normalizedPhone}`);
      } catch {
        setFormError('Terjadi kesalahan. Coba lagi.');
      }
    });
  }

  if (items.length === 0 && !isPending) {
    return (
      <CustomerPageWrapper>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-neutral-500 mb-4">Tidak ada produk di keranjang.</p>
          <Link href="/" className="btn-primary inline-block text-sm">Ke Katalog</Link>
        </div>
      </CustomerPageWrapper>
    );
  }

  return (
    <CustomerPageWrapper>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="font-heading font-bold text-2xl text-neutral-900 mb-4">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary */}
          <div className="card p-4">
            <h2 className="font-heading font-semibold text-sm text-neutral-700 mb-3">Ringkasan Pesanan</h2>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm py-1 border-b border-neutral-100 last:border-0">
                <span className="text-neutral-600 truncate max-w-[60%]">{item.product.name} x{item.quantity}</span>
                <span className="font-medium">{formatRupiah(item.activePrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Voucher */}
          <div className="card p-4">
            <h2 className="font-heading font-semibold text-sm text-neutral-700 mb-3 flex items-center gap-2">
              <Tag size={14} /> Voucher
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Kode voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="input-field py-2 text-sm flex-1"
                disabled={!!appliedVoucher}
              />
              {appliedVoucher ? (
                <button
                  type="button"
                  onClick={() => { setAppliedVoucher(null); setVoucherMsg(''); setVoucherCode(''); }}
                  className="px-3 py-2 rounded-xl border border-neutral-300 text-sm text-neutral-600"
                >
                  Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={voucherLoading || !voucherCode}
                  className="btn-secondary text-sm py-2"
                >
                  {voucherLoading ? '...' : 'Pakai'}
                </button>
              )}
            </div>
            {voucherMsg && (
              <p className={`text-xs mt-1.5 ${appliedVoucher ? 'text-success-500 font-medium' : 'text-danger-500'}`}>
                {voucherMsg}
              </p>
            )}
          </div>

          {/* Customer Form */}
          <div className="card p-4 space-y-3">
            <h2 className="font-heading font-semibold text-sm text-neutral-700">Data Pemesan</h2>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                placeholder="08xx atau +62xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Catatan (opsional)
              </label>
              <textarea
                placeholder="Permintaan khusus, lokasi pick up, dll."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field py-2 text-sm resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Total */}
          <div className="card p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-600">Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-success-500">Diskon Voucher</span>
                <span className="text-success-500">- {formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-neutral-100 pt-2 mt-1">
              <span>Total</span>
              <span className="text-accent-500">{formatRupiah(finalAmount)}</span>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-danger-500 text-center bg-red-50 py-2 rounded-lg px-3">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !config?.is_open}
            className="w-full btn-primary text-sm"
          >
            {isPending ? 'Memproses...' : config?.is_open ? 'Pesan Sekarang 🧊' : 'Toko Sedang Tutup'}
          </button>
        </form>
      </div>
    </CustomerPageWrapper>
  );
}
