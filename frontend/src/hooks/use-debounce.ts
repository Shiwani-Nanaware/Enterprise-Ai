/**
 * Generic debounce hook.
 * Returns a debounced version of the provided value.
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds. Defaults to 300ms.
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
