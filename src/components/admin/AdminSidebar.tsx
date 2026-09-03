'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardCheck,
  Package,
  FlaskConical,
  Boxes,
  Receipt,
  Wallet,
  BarChart3,
  Tag,
  LogOut,
  Store,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreConfig } from '@/contexts/StoreContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ClipboardCheck },
  { href: '/admin/pos', label: 'POS / Kasir', icon: ShoppingBag },
  { href: '/admin/produk', label: 'Produk & Foto', icon: Package },
  { href: '/admin/voucher', label: 'Voucher', icon: Tag },
  { href: '/admin/bahan-baku', label: 'Bahan Baku', icon: FlaskConical },
  { href: '/admin/stok', label: 'Mutasi Stok', icon: Boxes },
  { href: '/admin/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { href: '/admin/kas', label: 'Buku Kas', icon: Wallet },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="admin-sidebar flex flex-col justify-between shrink-0">
      <div>
        {/* Logo & Header */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-500 flex items-center justify-center text-white font-heading font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
              LG
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-white tracking-tight leading-tight">
                Lah Gabin
              </p>
              <p className="text-[11px] text-neutral-400 font-medium">Admin Portal</p>
            </div>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Store Toggle Widget (iOS Switch) */}
        <div className="px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <InteractiveStoreStatusToggle />
        </div>

        {/* Navigation */}
        <nav className="py-3 px-1 space-y-0.5 overflow-y-auto max-h-[calc(100vh-250px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'admin-sidebar-link group',
                  isActive && 'admin-sidebar-link-active bg-white/15 text-white'
                )}
              >
                <Icon size={18} className={cn('transition-colors', isActive ? 'text-accent-500' : 'text-neutral-400 group-hover:text-white')} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/10 space-y-1 bg-black/20">
        <Link
          href="/"
          target="_blank"
          className="admin-sidebar-link text-neutral-400 hover:text-white hover:bg-white/10 text-xs py-2"
        >
          <ExternalLink size={15} />
          <span>Lihat Web Customer</span>
        </Link>
        <button
          onClick={async () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/login';
            }
          }}
          className="w-full admin-sidebar-link text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs py-2"
        >
          <LogOut size={15} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

function InteractiveStoreStatusToggle() {
  const { config, toggleStoreStatus } = useStoreConfig();
  const [updating, setUpdating] = useState(false);
  const isOpen = Boolean(config?.is_open);

  const handleToggle = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      await toggleStoreStatus(!isOpen);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-7 h-7 rounded-xl flex items-center justify-center transition-colors',
          isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        )}>
          <Store size={15} />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-neutral-300">Status Toko</p>
          <p className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            isOpen ? 'text-emerald-400' : 'text-rose-400'
          )}>
            {isOpen ? '● Buka' : '● Tutup'}
          </p>
        </div>
      </div>

      {/* iOS Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isOpen}
        disabled={updating}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
          isOpen ? 'bg-emerald-500' : 'bg-neutral-600'
        )}
      >
        <span className="sr-only">Toggle Status Toko</span>
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            isOpen ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
