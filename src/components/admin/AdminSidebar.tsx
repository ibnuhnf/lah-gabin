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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreConfig } from '@/contexts/StoreContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useState } from 'react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {}
    localStorage.removeItem('lah_gabin_admin_session');
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        {/* Brand Logo Header */}
        <div
          className={cn(
            'py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between transition-all',
            collapsed ? 'px-3 justify-center' : 'px-5'
          )}
        >
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center text-white font-heading font-black text-base shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              LG
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-heading font-extrabold text-sm text-neutral-900 dark:text-white tracking-tight leading-tight truncate">
                  Lah Gabin
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  Admin Panel
                </p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Store Status iOS Switch (hidden in narrow mode) */}
        {!collapsed && (
          <div className="px-4 py-3.5 border-b border-slate-200/70 dark:border-white/[0.06]">
            <InteractiveStoreStatusToggle />
          </div>
        )}

        {/* Nav Groups */}
        <nav
          className={cn(
            'p-2.5 space-y-4 overflow-y-auto',
            collapsed ? 'max-h-[calc(100vh-180px)]' : 'max-h-[calc(100vh-250px)]'
          )}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                  {group.title}
                </p>
              )}
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
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
                        collapsed
                          ? 'justify-center p-2.5'
                          : 'justify-between px-3.5 py-2.5',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-neutral-900 dark:hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={cn(
                            'shrink-0 transition-colors',
                            isActive
                              ? 'text-white'
                              : 'text-neutral-400 dark:text-neutral-500'
                          )}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && isActive && (
                        <ChevronRight size={14} className="text-white/70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-1.5 bg-slate-50/50 dark:bg-white/[0.01]">
        {/* Toggle Collapse Button (Desktop) */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
            className={cn(
              'hidden lg:flex items-center rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05] transition-all w-full',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            )}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Sembunyikan Menu</span>}
          </button>
        )}

        <Link
          href="/"
          target="_blank"
          title={collapsed ? 'Lihat Web Customer' : undefined}
          className={cn(
            'flex items-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white rounded-xl transition-all',
            collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
          )}
        >
          <ExternalLink size={15} />
          {!collapsed && <span>Web Customer</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Keluar' : undefined}
          className={cn(
            'w-full flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all',
            collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
          )}
        >
          <LogOut size={15} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible width) */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 min-h-screen bg-white dark:bg-[#0b0d12] border-r border-slate-200/80 dark:border-white/[0.08] transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
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
    <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
            isOpen
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
          )}
        >
          <Store size={13} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
            Toko
          </p>
          <p
            className={cn(
              'text-[9px] font-extrabold uppercase tracking-wider',
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
          'relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
          isOpen ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'
        )}
      >
        <span className="sr-only">Toggle Status Toko</span>
        <span
          className={cn(
            'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
            isOpen ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
