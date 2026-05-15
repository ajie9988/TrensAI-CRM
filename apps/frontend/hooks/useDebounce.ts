import { useEffect, useState } from "react";

/**
 * Menunda update nilai sampai user berhenti mengetik selama `delay` ms.
 * Berguna untuk search bar agar tidak trigger API call setiap keystroke.
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 400);
 * useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
