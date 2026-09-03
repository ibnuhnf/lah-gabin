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
  ExternalLink,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreConfig } from '@/contexts/StoreContext';
import { useState } from 'react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_GROUPS = [
  {
    title: 'UTAMA',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/pesanan', label: 'Pesanan Masuk', icon: ClipboardCheck },
      { href: '/admin/pos', label: 'POS / Kasir', icon: ShoppingBag },
    ],
  },
  {
    title: 'PRODUK & INVENTARIS',
    items: [
      { href: '/admin/produk', label: 'Produk & Foto', icon: Package },
      { href: '/admin/voucher', label: 'Voucher Diskon', icon: Tag },
      { href: '/admin/bahan-baku', label: 'Bahan Baku', icon: FlaskConical },
      { href: '/admin/stok', label: 'Mutasi Stok', icon: Boxes },
    ],
  },
  {
    title: 'KEUANGAN & ANALITIK',
    items: [
      { href: '/admin/kas', label: 'Buku Kas & Saldo', icon: Wallet },
      { href: '/admin/pengeluaran', label: 'Pengeluaran', icon: Receipt },
      { href: '/admin/laporan', label: 'Laporan Finansial', icon: BarChart3 },
    ],
  },
];

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Logo Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center text-white font-heading font-black text-base shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              LG
            </div>
            <div>
              <p className="font-heading font-extrabold text-sm text-neutral-900 dark:text-white tracking-tight leading-tight">
                Lah Gabin
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Admin Panel
              </p>
            </div>
          </Link>

          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Store Status iOS Switch */}
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-white/[0.06]">
          <InteractiveStoreStatusToggle />
        </div>

        {/* Nav Groups */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-neutral-900 dark:hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={17}
                          className={cn(
                            'transition-colors',
                            isActive ? 'text-white' : 'text-neutral-400 dark:text-neutral-500'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-white/70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-200/80 dark:border-white/[0.08] space-y-1.5 bg-slate-50/50 dark:bg-white/[0.01]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white rounded-xl transition-all"
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
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
        >
          <LogOut size={15} />
          <span>Keluar Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 min-h-screen bg-white dark:bg-[#0b0d12] border-r border-slate-200/80 dark:border-white/[0.08] transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0b0d12] border-r border-slate-200 dark:border-white/[0.08] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
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
    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-7 h-7 rounded-xl flex items-center justify-center transition-colors',
            isOpen
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
          )}
        >
          <Store size={15} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            Status Toko
          </p>
          <p
            className={cn(
              'text-[10px] font-extrabold uppercase tracking-wider',
              isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isOpen ? '● Buka' : '● Tutup'}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isOpen}
        disabled={updating}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
          isOpen ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'
        )}
      >
        <span className="sr-only">Toggle Status Toko</span>
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            isOpen ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
