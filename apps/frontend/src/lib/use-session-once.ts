import { useCallback, useEffect, useState } from 'react';

// True once per browser tab session: the first time `condition` is seen true
// for `key`. Unlike useCelebrateOnce (localStorage, once per browser) a new
// tab or window starts a fresh session and shows it again; a reload in the
// same tab does not. The key is written when it fires — not on dismiss — so a
// reload mid-celebration never repeats it. Unreadable storage means no show.
export function useSessionOnce(key: string, condition: boolean) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!condition) return;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, new Date().toISOString());
    } catch {
      return;
    }
    setShow(true);
  }, [key, condition]);

  const dismiss = useCallback(() => setShow(false), []);
  return { show, dismiss };
}
