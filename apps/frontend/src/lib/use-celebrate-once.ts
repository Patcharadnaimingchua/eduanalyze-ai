import { useEffect, useState } from 'react';

// True once per milestone per browser: the first time `condition` is seen
// true for `key`, not on every reload. Dropping below the milestone clears
// the key, so crossing it again celebrates again. Unreadable storage means
// no celebration — silent beats firing on every visit.
export function useCelebrateOnce(key: string, condition: boolean) {
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    try {
      if (!condition) {
        localStorage.removeItem(key);
        return;
      }
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      return;
    }
    // The globals.css reduced-motion rule would still flash the pieces for
    // a frame, so skip rendering them entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setCelebrate(true);
  }, [key, condition]);

  return celebrate;
}
