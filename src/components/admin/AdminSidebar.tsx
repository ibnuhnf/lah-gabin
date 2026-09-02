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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ClipboardCheck },
  { href: '/admin/pos', label: 'POS / Kasir', icon: ShoppingBag },
  { href: '/admin/produk', label: 'Produk', icon: Package },
  { href: '/admin/voucher', label: 'Voucher', icon: Tag },
  { href: '/admin/bahan-baku', label: 'Bahan Baku', icon: FlaskConical },
  { href: '/admin/stok', label: 'Mutasi Stok', icon: Boxes },
  { href: '/admin/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { href: '/admin/kas', label: 'Buku Kas', icon: Wallet },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-white font-heading font-bold text-sm">
            LG
          </div>
          <div>
            <p className="font-heading font-bold text-sm text-white">Lah Gabin</p>
            <p className="text-[10px] text-blue-200">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Store Toggle */}
      <div className="px-4 py-3 border-b border-white/10">
        <StoreStatusToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'admin-sidebar-link',
                isActive && 'admin-sidebar-link-active'
              )}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button className="admin-sidebar-link text-red-300 hover:text-red-200 hover:bg-red-900/30">
          <LogOut size={18} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </aside>
  );
}

function StoreStatusToggle() {
  return (
    <div className="flex items-center gap-2 text-xs text-blue-200">
      <Store size={14} />
      <span className="flex-1">Status Toko</span>
      <span className="bg-success-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        BUKA
      </span>
    </div>
  );
}
