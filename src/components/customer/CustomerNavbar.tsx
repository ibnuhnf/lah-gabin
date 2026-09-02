'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';

export default function CustomerNavbar() {
  const { totalItems } = useCart();
  const { config } = useStoreConfig();

  return (
    <header className="sticky top-0 z-50 bg-brand-900 text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-heading font-bold text-lg tracking-tight text-white">
          Lah Gabin 🧊
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              config?.is_open
                ? 'bg-success-500 text-white'
                : 'bg-neutral-500 text-white'
            }`}
          >
            {config?.is_open ? '● Buka' : '● Tutup'}
          </span>

          <Link href="/keranjang" className="relative p-2">
            <ShoppingCart size={22} className="text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
