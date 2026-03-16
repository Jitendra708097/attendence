/**
 * @module useDebounce
 * @description Debounces a value by a given delay in ms.
 *              Used for search inputs throughout the portal.
 * @param {any} value
 * @param {number} delay - milliseconds
 */

import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
