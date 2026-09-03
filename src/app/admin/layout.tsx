'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  // Sidebar preference persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lah_gabin_sidebar_collapsed');
      if (saved === '1') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lah_gabin_sidebar_collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  // Auth guard: block all admin routes except /admin/login unless authenticated
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (isLoginPage) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }

      // 1) Check Supabase session
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            if (!cancelled) {
              setIsAuthenticated(true);
              setAuthChecked(true);
            }
            return;
          }
        } catch {
          // fall through to localStorage fallback
        }
      }

      // 2) LocalStorage fallback for dev/demo mode
      try {
        const localSession = localStorage.getItem('lah_gabin_admin_session');
        if (localSession) {
          if (!cancelled) {
            setIsAuthenticated(true);
            setAuthChecked(true);
          }
          return;
        }
      } catch {}

      if (!cancelled) {
        setIsAuthenticated(false);
        setAuthChecked(true);
        router.replace('/admin/login');
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, isLoginPage]);

  // Loading state
  if (!authChecked && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#06080d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl border-4 border-slate-200 dark:border-white/[0.08] border-t-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-neutral-500">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  // Login page: no sidebar/topbar shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#06080d] text-neutral-900 dark:text-neutral-100 transition-colors font-sans antialiased">
      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
