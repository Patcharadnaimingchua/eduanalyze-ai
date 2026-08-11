import { useEffect, useRef, useState } from 'react';

// Hand-rolled number-counting animation — no animation library in this
// project (recharts/framer-motion deliberately rejected, same convention
// as the hand-rolled SVG charts elsewhere). Pure requestAnimationFrame +
// ease-out-cubic, animates from whatever the value previously was (so a
// later refetch to a new number re-animates too, not just the first load).
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(target: number, options?: { duration?: number; decimals?: number }) {
  const duration = options?.duration ?? 900;
  const decimals = options?.decimals ?? 0;

  // Always starts counting from 0 on mount — this hook is only ever
  // called once real data has already loaded (the page returns early
  // during the loading state), so `target` IS the final value on the
  // very first render; seeding from/display with `target` here would
  // skip the count-up animation entirely and just show the end number.
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = from + (target - from) * eased;
      setDisplay(Number(current.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, decimals]);

  return display;
}
