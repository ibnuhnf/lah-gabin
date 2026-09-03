'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useStoreConfig } from '@/contexts/StoreContext';

interface AdminTopBarProps {
  onMobileMenuClick?: () => void;
}

export default function AdminTopBar({ onMobileMenuClick }: AdminTopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { config } = useStoreConfig();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isOpen = Boolean(config?.is_open);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-[#0b0d12]/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/[0.06] transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
            aria-label="Buka Menu"
          >
            <Menu size={18} />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center relative">
            <Search
              size={16}
              className="absolute left-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Cari pesanan, produk, atau menu…"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
              className="w-[320px] lg:w-[420px] pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] rounded-xl text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white dark:focus:bg-[#12141a] focus:border-blue-500/30 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search trigger (mobile) */}
          <button
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            aria-label="Cari"
          >
            <Search size={18} />
          </button>

          {/* Store Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.05] rounded-full border border-slate-200/70 dark:border-white/[0.06]">
            <span
              className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'}`}
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
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors relative"
              aria-label="Notifikasi"
            >
              <Bell size={17} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0b0d12]" />
            </button>
            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200/70 dark:border-white/[0.08] shadow-xl z-20 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-neutral-900 dark:text-white">
                      Notifikasi
                    </h3>
                    <span className="text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                      3 Baru
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05]">
                    <NotifItem
                      icon="📦"
                      title="Pesanan Baru"
                      desc="Pesanan LG-20260904-X1Y2 dari Siti Aminah"
                      time="2 menit lalu"
                      tone="blue"
                    />
                    <NotifItem
                      icon="⚠️"
                      title="Stok Kritis"
                      desc="Es Gabin Tiramisu hampir habis"
                      time="1 jam lalu"
                      tone="amber"
                    />
                    <NotifItem
                      icon="✅"
                      title="Pembayaran Diterima"
                      desc="LG-20260903-B7C8 lunas sebesar Rp 35.000"
                      time="3 jam lalu"
                      tone="emerald"
                    />
                  </div>
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
              className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-heading font-bold text-sm">
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200 leading-tight">
                  Admin
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-500 font-medium leading-tight">
                  Super User
                </p>
              </div>
              <ChevronDown size={14} className="text-neutral-500 hidden sm:block" />
            </button>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200/70 dark:border-white/[0.08] shadow-xl z-20 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-white/[0.05]">
                    <p className="font-heading font-bold text-sm text-neutral-900 dark:text-white">
                      Admin Lah Gabin
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      admin@lahgabin.id
                    </p>
                  </div>
                  <div className="py-1.5">
                    <DropdownItem href="/admin/dashboard" icon={<User size={14} />}>
                      Dashboard
                    </DropdownItem>
                    <DropdownItem href="/admin/pesanan" icon={<Globe size={14} />}>
                      Pesanan Online
                    </DropdownItem>
                    <DropdownItem href="/admin/produk" icon={<Settings size={14} />}>
                      Pengaturan Produk
                    </DropdownItem>
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/admin/login';
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-slate-100 dark:border-white/[0.05]"
                  >
                    <LogOut size={14} /> Keluar (Log Out)
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

function NotifItem({
  icon,
  title,
  desc,
  time,
  tone,
}: {
  icon: string;
  title: string;
  desc: string;
  time: string;
  tone: 'blue' | 'amber' | 'emerald';
}) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };
  return (
    <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors">
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${tones[tone]}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neutral-900 dark:text-white">{title}</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
            {desc}
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
            {time}
          </p>
        </div>
      </div>
    </div>
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
      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
    >
      <span className="text-neutral-400">{icon}</span>
      {children}
    </Link>
  );
}
