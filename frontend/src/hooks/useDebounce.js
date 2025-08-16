// src/hooks/useDebounce.js
import { useEffect, useState } from 'react';

/**
 * useDebounce(value, wait)
 * returns debounced value that updates after `wait` ms of silence
 */
export function useDebounce(value, wait = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), wait);
    return () => clearTimeout(t);
  }, [value, wait]);

  return debounced;
}
