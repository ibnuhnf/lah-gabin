'use client';

import Link from 'next/link';
import { ShoppingBag, Sun, Moon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { useTheme } from '@/contexts/ThemeContext';

const ICON_BTN =
  'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

export default function CustomerNavbar() {
  const { totalItems } = useCart();
  const { config } = useStoreConfig();
  const { theme, toggleTheme } = useTheme();
  const isOpen = Boolean(config?.is_open);

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-slate-200/70 dark:border-neutral-800 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <img
            src="/img/logo.svg"
            alt="Lah Gabin Logo"
            className="w-9 h-9 rounded-lg object-contain shrink-0"
          />
          <img
            src="/img/logo navbar.svg"
            alt="Lah Gabin"
            className="h-8 sm:h-9 w-auto object-contain dark:brightness-110"
          />
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2">
          {/* Live Store Status Badge */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              isOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
            {isOpen ? 'Buka' : 'Tutup'}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Ganti Tema"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            className={`${ICON_BTN} bg-slate-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Cart Icon */}
          <Link
            href="/keranjang"
            aria-label="Keranjang Belanja"
            className={`${ICON_BTN} relative bg-brand-600 hover:bg-accent-600 text-white`}
          >
            <ShoppingBag size={15} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-brand-600 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-brand-100">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
