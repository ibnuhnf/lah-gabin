'use client';

import Link from 'next/link';
import { ShoppingBag, Sun, Moon, Store } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function CustomerNavbar() {
  const { totalItems } = useCart();
  const { config } = useStoreConfig();
  const { theme, toggleTheme } = useTheme();
  const isOpen = Boolean(config?.is_open);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-b border-neutral-200/70 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-15 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-500 flex items-center justify-center text-white font-heading font-extrabold text-xs shadow-sm group-hover:scale-105 transition-transform">
            LG
          </div>
          <span className="font-heading font-extrabold text-base tracking-tight text-neutral-900 dark:text-white">
            Lah Gabin <span className="text-accent-500 text-xs">●</span>
          </span>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Store Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full transition-all ${
              isOpen
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {isOpen ? 'Buka' : 'Tutup'}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Mode Gelap"
            className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-all active:scale-95"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Cart Floating / Header Icon */}
          <Link
            href="/keranjang"
            className="relative w-9 h-9 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white flex items-center justify-center shadow-xs transition-all active:scale-95"
          >
            <ShoppingBag size={17} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
