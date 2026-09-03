'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatRupiah } from '@/lib/utils';

export default function FloatingCartBar() {
  const { totalItems, subtotal } = useCart();
  const pathname = usePathname();

  // Don't display floating bar if cart is empty or user is already on cart/checkout pages
  if (totalItems === 0 || pathname === '/keranjang' || pathname === '/checkout') {
    return null;
  }

  return (
    <div className="fixed bottom-5 inset-x-0 z-40 px-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-200">
      <Link
        href="/keranjang"
        className="pointer-events-auto max-w-md w-full bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 backdrop-blur-2xl rounded-2xl p-3.5 px-5 shadow-2xl shadow-blue-500/20 border border-white/20 dark:border-neutral-800 flex items-center justify-between gap-3 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <ShoppingBag size={16} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-bold text-xs tracking-tight">
              Lihat Keranjang
            </span>
            <span className="text-[11px] text-neutral-300 dark:text-neutral-600 font-medium">
              {totalItems} item dipilih
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-sm tracking-tight text-white dark:text-neutral-900">
            {formatRupiah(subtotal)}
          </span>
          <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-neutral-900/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ArrowRight size={13} />
          </div>
        </div>
      </Link>
    </div>
  );
}
