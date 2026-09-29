import { useEffect, useState } from 'react';

/**
 * Debounce value. Kecil dan cukup — 20 baris, tanpa dependency.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
