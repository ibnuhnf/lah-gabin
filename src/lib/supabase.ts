import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const hasValidConfig = isValidUrl(rawUrl) && rawKey.length > 0;

// Lazy or safe client
let realClient: SupabaseClient | null = null;

if (hasValidConfig) {
  try {
    realClient = createClient(rawUrl, rawKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

// Chainable dummy query builder for build-time safety & graceful fallback
const createDummyQuery = () => {
  const dummyResult = Promise.resolve({ data: null, error: null, count: 0 });
  const builder: any = () => builder;
  return new Proxy(builder, {
    get: (_target, prop) => {
      if (prop === 'then') return dummyResult.then.bind(dummyResult);
      if (prop === 'catch') return dummyResult.catch.bind(dummyResult);
      return () => createDummyQuery();
    },
    apply: () => createDummyQuery(),
  });
};

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    if (realClient) {
      const val = (realClient as any)[prop];
      if (typeof val === 'function') {
        return val.bind(realClient);
      }
      return val;
    }
    if (prop === 'from' || prop === 'rpc' || prop === 'storage' || prop === 'auth') {
      return () => createDummyQuery();
    }
    return undefined;
  },
});

export const isSupabaseConfigured = () => hasValidConfig;
export const getSupabase = () => (hasValidConfig ? supabase : null);
