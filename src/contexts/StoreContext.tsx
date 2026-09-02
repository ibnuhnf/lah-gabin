'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { StoreConfig } from '@/types';

interface StoreContextValue {
  config: StoreConfig | null;
  loading: boolean;
  refresh: () => void;
}

const StoreContext = createContext<StoreContextValue>({
  config: null,
  loading: true,
  refresh: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await supabase
        .from('store_config')
        .select('*')
        .limit(1)
        .single();
      setConfig(data);
    } catch {
      setConfig({ id: '', is_open: false, wa_number: '6282121498255', updated_at: '' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <StoreContext.Provider value={{ config, loading, refresh: load }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreConfig() {
  return useContext(StoreContext);
}
