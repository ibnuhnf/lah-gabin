'use client';

import Link from 'next/link';
import { ShoppingBag, Sun, Moon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function CustomerNavbar() {
  const { totalItems } = useCart();
  const { config } = useStoreConfig();
  const { theme, toggleTheme } = useTheme();
  const isOpen = Boolean(config?.is_open);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-xl bg-accent-500 flex items-center justify-center text-white font-heading font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            LG
          </div>
          <span className="font-heading font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
            Lah Gabin
          </span>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2">
          {/* Live Store Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all ${
              isOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {isOpen ? 'Buka' : 'Tutup'}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Ganti Tema"
            className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-all active:scale-95"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Cart Icon */}
          <Link
            href="/keranjang"
            className="relative w-8 h-8 rounded-xl bg-accent-500 hover:bg-accent-600 text-white flex items-center justify-center shadow-xs transition-all active:scale-95"
            aria-label="Keranjang Belanja"
          >
            <ShoppingBag size={15} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
