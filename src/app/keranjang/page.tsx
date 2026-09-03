'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { useCart } from '@/contexts/CartContext';
import { formatRupiah } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();

  return (
    <CustomerPageWrapper>
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-heading font-bold text-xl text-neutral-900 dark:text-white">
            Keranjang Belanja
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-4">Keranjang belanja Anda masih kosong.</p>
            <Link href="/" className="btn-primary inline-flex text-xs">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 mb-5">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="card p-3.5 flex items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product.image_urls?.[0] && item.product.image_urls[0] !== '/placeholder-gabin.jpg' ? (
                      <img
                        src={item.product.image_urls[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-neutral-400">LG</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                      {formatRupiah(item.activePrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="qty-stepper-btn"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-neutral-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="qty-stepper-btn"
                      aria-label="Tambah jumlah"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-1 w-8 h-8 flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      aria-label="Hapus item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4 space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400 text-xs">Total Harga Item</span>
                <span className="font-bold text-neutral-900 dark:text-white text-sm">{formatRupiah(subtotal)}</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Diskon voucher akan dihitung pada langkah checkout.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={clearCart}
                className="flex-1 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Kosongkan
              </button>
              <Link
                href="/checkout"
                className="flex-[2] btn-primary text-center text-xs py-3 font-semibold shadow-md"
              >
                Lanjut ke Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </CustomerPageWrapper>
  );
}
