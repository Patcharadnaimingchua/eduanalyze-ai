import { useEffect, useRef, useState } from 'react';

// Hand-rolled number-counting animation — no animation library in this
// project (recharts/framer-motion deliberately rejected, same convention
// as the hand-rolled SVG charts elsewhere). Pure requestAnimationFrame +
// ease-out-cubic, animates from whatever the value previously was (so a
// later refetch to a new number re-animates too, not just the first load).
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(
  target: number,
  options?: { duration?: number; decimals?: number; replayKey?: unknown },
) {
  const duration = options?.duration ?? 900;
  const decimals = options?.decimals ?? 0;
  const replayKey = options?.replayKey;

  // Always starts counting from 0 on mount — this hook is only ever
  // called once real data has already loaded (the page returns early
  // during the loading state), so `target` IS the final value on the
  // very first render; seeding from/display with `target` here would
  // skip the count-up animation entirely and just show the end number.
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number>();
  // Optional, backward-compatible: callers that never pass replayKey
  // (e.g. Dashboard F2's StatCards) get undefined here forever, so
  // replayRequested is always false and behavior is unchanged. Callers
  // that DO pass a changing replayKey (e.g. an accordion section's
  // open-count) get the animation replayed from 0 without needing to
  // remount the component — see record-timeline.tsx.
  const prevReplayKeyRef = useRef(replayKey);

  useEffect(() => {
    const replayRequested = replayKey !== undefined && replayKey !== prevReplayKeyRef.current;
    prevReplayKeyRef.current = replayKey;

    const from = replayRequested ? 0 : fromRef.current;
    if (!replayRequested && from === target) return;
    if (replayRequested) fromRef.current = 0;

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
  }, [target, duration, decimals, replayKey]);

  return display;
}
