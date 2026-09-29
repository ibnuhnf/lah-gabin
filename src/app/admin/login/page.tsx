'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured()) {
      setError('Server otentikasi belum dikonfigurasi. Hubungi administrator.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        setError('Email atau password tidak sesuai.');
        setLoading(false);
        return;
      }

      if (data?.session) {
        localStorage.setItem(
          'lah_gabin_admin_session',
          JSON.stringify({ email: data.user.email, role: 'admin', time: Date.now() })
        );
        router.replace('/admin/dashboard');
        return;
      }

      setError('Sesi tidak valid. Coba lagi.');
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-[#06080d] text-neutral-900 dark:text-neutral-100 transition-colors">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="bankzai-card p-7 sm:p-9 shadow-sm">
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-xl bg-brand-600 flex items-center justify-center text-white font-heading font-bold text-xl mb-4">
              LG
            </div>
            <h1 className="font-heading font-extrabold text-xl text-neutral-900 dark:text-white tracking-tight">
              Lah Gabin Admin
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Masukkan kredensial untuk mengakses portal manajemen
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-lg text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:bg-white dark:focus:bg-[#12141a] transition-all font-medium"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-lg text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:bg-white dark:focus:bg-[#12141a] transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-bold shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Portal'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Sistem Otentikasi Terenkripsi & Terlindungi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
