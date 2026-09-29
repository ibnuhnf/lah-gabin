'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Globe,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';
import { fetchAllOrders } from '@/lib/orderStore';
import type { Order } from '@/types';

interface AdminTopBarProps {
  onMobileMenuClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TOPBAR_BTN =
  'w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';

export default function AdminTopBar({
  onMobileMenuClick,
  collapsed = false,
  onToggleCollapse,
}: AdminTopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { config } = useStoreConfig();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const isOpen = Boolean(config?.is_open);

  const fetchPendingOrders = async () => {
    try {
      const allOrders = await fetchAllOrders();
      const pending = allOrders.filter((o) => o.status === 'PENDING_APPROVAL');
      setPendingOrders(pending);
    } catch {}
  };

  useEffect(() => {
    fetchPendingOrders();
    try {
      const s = localStorage.getItem('lah_gabin_admin_session');
      if (s) setAdminEmail(JSON.parse(s).email || '');
    } catch {}
    const interval = setInterval(fetchPendingOrders, 5000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lah_gabin_admin_orders') {
        fetchPendingOrders();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel: any = null;
    if (isSupabaseConfigured()) {
      try {
        channel = supabase
          .channel('admintopbar-orders-channel-v2')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              fetchPendingOrders();
            }
          )
          .subscribe();
      } catch {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      if (channel && isSupabaseConfigured()) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

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

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-[#0b0d12]/95 backdrop-blur-md border-b border-slate-200/70 dark:border-white/[0.06] transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Left Section: Toggle Buttons & Search */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={onMobileMenuClick}
            className={`lg:hidden ${TOPBAR_BTN}`}
            aria-label="Buka Menu Mobile"
          >
            <Menu size={18} />
          </button>

          {/* Desktop Sidebar Collapse/Expand Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex ${TOPBAR_BTN}`}
              title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
              aria-label="Toggle Sidebar"
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}

          {/* Search Bar */}
          <div className="hidden md:flex items-center relative">
            <label htmlFor="admin-topbar-search" className="sr-only">
              Cari pesanan atau produk
            </label>
            <Search
              size={15}
              className="absolute left-3 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="admin-topbar-search"
              type="search"
              placeholder="Cari pesanan, produk, atau menu…"
              className="w-[260px] lg:w-[320px] pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-lg text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:bg-white dark:focus:bg-[#12141a] transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Store Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/[0.05] rounded-full border border-slate-200/70 dark:border-white/[0.06]">
            <span
              className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {isOpen ? 'Toko Buka' : 'Toko Tutup'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className={TOPBAR_BTN}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className={`${TOPBAR_BTN} relative`}
              aria-label="Notifikasi"
              aria-expanded={notifOpen}
            >
              <Bell size={16} />
              {pendingOrders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[10px] rounded-full ring-2 ring-white dark:ring-[#0b0d12] flex items-center justify-center tabular-nums shadow-xs">
                  {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#12141a] rounded-xl border border-slate-200/70 dark:border-white/[0.08] shadow-lg z-20 overflow-hidden animate-in fade-in duration-150">
                  <div className="p-3.5 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-xs text-neutral-900 dark:text-white">
                        Notifikasi
                      </h3>
                      {pendingOrders.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] tabular-nums">
                          {pendingOrders.length} Menunggu
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {pendingOrders.length === 0 ? (
                      <div className="p-6 text-center flex flex-col items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <CheckCircle2 size={20} className="text-emerald-500 opacity-80" />
                        <p className="font-semibold">Semua pesanan telah dikonfirmasi</p>
                        <p className="text-[11px] text-neutral-400">Belum ada pesanan baru.</p>
                      </div>
                    ) : (
                      pendingOrders.map((order) => (
                        <Link
                          key={order.id || order.invoice_code}
                          href="/admin/pesanan"
                          onClick={() => setNotifOpen(false)}
                          className="p-3 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group block"
                        >
                          <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {order.customer_name || 'Pelanggan'}
                              </p>
                              <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 shrink-0">
                                {order.invoice_code}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                              Total: <span className="font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{formatRupiah(order.final_amount)}</span>
                            </p>
                            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 group-hover:underline">
                              Perlu konfirmasi admin <ArrowRight size={10} />
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  {pendingOrders.length > 0 && (
                    <div className="p-2 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.05]">
                      <Link
                        href="/admin/pesanan"
                        onClick={() => setNotifOpen(false)}
                        className="w-full py-1.5 px-3 rounded-lg bg-brand-600 hover:bg-accent-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ClipboardCheck size={14} /> Kelola Pesanan
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label="Menu Profil"
              aria-expanded={profileOpen}
            >
              <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center text-white font-heading font-bold text-xs shadow-xs">
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200 leading-tight">
                  Admin
                </p>
                <p className="text-[10px] text-neutral-500 font-medium leading-tight">
                  Super User
                </p>
              </div>
              <ChevronDown size={13} className="text-neutral-500 hidden sm:block" />
            </button>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12141a] rounded-xl border border-slate-200/70 dark:border-white/[0.08] shadow-lg z-20 overflow-hidden animate-in fade-in duration-150">
                  <div className="p-3 border-b border-slate-100 dark:border-white/[0.05]">
                    <p className="font-heading font-bold text-xs text-neutral-900 dark:text-white">
                      Admin Lah Gabin
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {adminEmail || 'Super User'}
                    </p>
                  </div>
                  <div className="py-1">
                    <DropdownItem href="/admin/dashboard" icon={<User size={13} />}>
                      Dashboard
                    </DropdownItem>
                    <DropdownItem href="/admin/pesanan" icon={<Globe size={13} />}>
                      Pesanan Online
                    </DropdownItem>
                    <DropdownItem href="/admin/produk" icon={<Settings size={13} />}>
                      Pengaturan Produk
                    </DropdownItem>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-slate-100 dark:border-white/[0.05]"
                  >
                    <LogOut size={13} /> Keluar (Log Out)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function DropdownItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
    >
      <span className="text-neutral-400">{icon}</span>
      {children}
    </Link>
  );
}
