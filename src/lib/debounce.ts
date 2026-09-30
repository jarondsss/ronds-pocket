import { useCallback, useEffect, useRef, useState } from "react";

/** Default jeda sebelum perubahan dikirim ke backend. */
export const WRITE_DEBOUNCE_MS = 600;

/** Nilai yang baru ikut berubah setelah pengguna berhenti mengetik. */
export function useDebouncedValue<T>(value: T, delay = WRITE_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Fungsi yang cuma jalan sekali setelah rentetan pemanggilan terakhir. */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay = WRITE_DEBOUNCE_MS,
) {
  const timer = useRef<number | null>(null);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return useCallback(
    (...args: A) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => latest.current(...args), delay);
    },
    [delay],
  );
}
