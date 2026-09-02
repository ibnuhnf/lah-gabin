'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import { useCart } from '@/contexts/CartContext';
import { formatRupiah } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();

  return (
    <CustomerPageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="font-heading font-bold text-2xl text-neutral-900 mb-4">
          Keranjang
        </h1>

        {items.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-neutral-500 mb-4">Keranjangmu masih kosong.</p>
            <Link href="/" className="btn-primary inline-block text-sm">
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="card p-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                    {item.product.image_urls?.[0] ? (
                      <img
                        src={item.product.image_urls[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-neutral-900 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {formatRupiah(item.activePrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="qty-stepper-btn"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center font-bold text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="qty-stepper-btn"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-1 w-9 h-9 flex items-center justify-center rounded-lg text-danger-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-bold">{formatRupiah(subtotal)}</span>
              </div>
              <p className="text-xs text-neutral-400">
                * Voucher & ongkir dihitung saat checkout
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 py-3 rounded-xl border border-neutral-300 text-neutral-600 font-medium text-sm"
              >
                Kosongkan
              </button>
              <Link
                href="/checkout"
                className="flex-[2] btn-primary text-center text-sm"
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
