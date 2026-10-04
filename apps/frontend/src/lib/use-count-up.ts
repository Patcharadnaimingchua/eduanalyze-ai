import { useEffect, useRef, useState } from 'react';

// Hand-rolled number-counting animation — no animation library in this
// project (recharts/framer-motion deliberately rejected, same convention
// as the hand-rolled SVG charts elsewhere). Pure requestAnimationFrame +
// ease-out-cubic, animates from whatever the value previously was (so a
// later refetch to a new number re-animates too, not just the first load).
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Overshoots the target, then rings down to it. Callers must pair it with a
// clamp (see `easing` below) — the raw curve peaks above 1.
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
}

export function useCountUp(
  target: number,
  options?: {
    duration?: number;
    decimals?: number;
    replayKey?: unknown;
    // 'elastic' is opt-in. The displayed value is always clamped to
    // [clampMin, clampMax]; without them the range is just from..target, i.e.
    // no overshoot at all, only the dips below the target. Pass the real
    // bounds (GPA 0-4, credits 0-total) to let it overshoot safely. Never use
    // it for values that drive a threshold (ring colour, confetti, >= 100).
    easing?: 'cubic' | 'elastic';
    clampMin?: number;
    clampMax?: number;
  },
) {
  const duration = options?.duration ?? 900;
  const decimals = options?.decimals ?? 0;
  const replayKey = options?.replayKey;
  const easing = options?.easing ?? 'cubic';
  const clampMin = options?.clampMin;
  const clampMax = options?.clampMax;

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
    if (!Number.isFinite(target)) return;
    const replayRequested = replayKey !== undefined && replayKey !== prevReplayKeyRef.current;
    prevReplayKeyRef.current = replayKey;

    // A requestAnimationFrame loop is out of reach of the globals.css
    // media query, so the preference has to be honoured here as well.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }

    const from = replayRequested ? 0 : fromRef.current;
    if (!replayRequested && from === target) return;
    if (replayRequested) fromRef.current = 0;

    const lower = clampMin ?? Math.min(from, target);
    const upper = clampMax ?? Math.max(from, target);

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      let current: number;
      if (easing === 'elastic') {
        const raw = from + (target - from) * easeOutElastic(progress);
        current = progress >= 1 ? target : Math.min(upper, Math.max(lower, raw));
      } else {
        current = from + (target - from) * easeOutCubic(progress);
      }
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
  }, [target, duration, decimals, replayKey, easing, clampMin, clampMax]);

  return display;
}
