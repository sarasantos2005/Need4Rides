import { useState, useRef, useCallback } from 'react';

export default function useMinLoading(minMs = 8100) {
  const [loading, setLoadingState] = useState(true);
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  const setLoading = useCallback((value) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value) {
      startRef.current = Date.now();
      setLoadingState(true);
    } else {
      const elapsed = Date.now() - startRef.current;
      const remaining = minMs - elapsed;
      if (remaining > 0) {
        timerRef.current = setTimeout(() => setLoadingState(false), remaining);
      } else {
        setLoadingState(false);
      }
    }
  }, [minMs]);

  return [loading, setLoading];
}
