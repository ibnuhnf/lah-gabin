'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StoreConfig } from '@/types';

interface StoreContextValue {
  config: StoreConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
  toggleStoreStatus: (isOpen: boolean) => Promise<boolean>;
}

const DEFAULT_CONFIG: StoreConfig = {
  id: 'default',
  is_open: true,
  wa_number: '6282121498255',
  qris_image_url: '',
  bank_account_info: 'BCA 123-456-789 a/n Lah Gabin',
  updated_at: new Date().toISOString(),
};

const StoreContext = createContext<StoreContextValue>({
  config: DEFAULT_CONFIG,
  loading: false,
  refresh: async () => {},
  toggleStoreStatus: async () => true,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // 1. Check localStorage first for instant reactivity
    let localIsOpen: boolean | null = null;
    try {
      const stored = localStorage.getItem('lah_gabin_store_open');
      if (stored !== null) {
        localIsOpen = stored === 'true';
      }
    } catch {}

    // Initial seed from local if available
    if (localIsOpen !== null) {
      setConfig((prev) => ({ ...prev, is_open: localIsOpen! }));
    }

    // 2. Fetch from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_config')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setConfig(data);
          try {
            localStorage.setItem('lah_gabin_store_open', String(data.is_open));
          } catch {}
        }
      } catch (err) {
        console.warn('Store config fetch fallback:', err);
      }
    }
    setLoading(false);
  }, []);

  const toggleStoreStatus = async (isOpen: boolean): Promise<boolean> => {
    // Instant UI update
    setConfig((prev) => ({ ...prev, is_open: isOpen }));
    try {
      localStorage.setItem('lah_gabin_store_open', String(isOpen));
      // Notify other tabs
      window.dispatchEvent(new Event('lah_gabin_store_changed'));
    } catch {}

    // Persist to Supabase
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('store_config')
          .update({ is_open: isOpen, updated_at: new Date().toISOString() })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // update any existing row

        if (error) {
          console.warn('Failed to update Supabase store_config, using local state:', error);
        }
      } catch (err) {
        console.warn('Network error updating store status:', err);
      }
    }
    return true;
  };

  useEffect(() => {
    load();

    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('lah_gabin_store_open');
        if (stored !== null) {
          const isOpen = stored === 'true';
          setConfig((prev) => ({ ...prev, is_open: isOpen }));
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('lah_gabin_store_changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lah_gabin_store_changed', handleStorageChange);
    };
  }, [load]);

  return (
    <StoreContext.Provider value={{ config, loading, refresh: load, toggleStoreStatus }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreConfig() {
  return useContext(StoreContext);
}
