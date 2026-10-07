'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { COUNT_UP_MS, isCountable, numberText } from '@/lib/animated-number';
import { useCountUp } from '@/lib/use-count-up';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const prefersReducedMotion = () => window.matchMedia(QUERY).matches;

// A figure that counts up once when it first appears. After that, and for a
// missing value, it is plain text. Under reduced motion it is the final value
// from the first paint. A screen reader gets the final value only.
export function AnimatedNumber({
  value,
  format = String,
  decimals = 0,
  fallback = '—',
  duration = COUNT_UP_MS,
}: Readonly<{
  value: number | null | undefined;
  format?: (n: number) => string;
  decimals?: number;
  fallback?: string;
  duration?: number;
}>) {
  const countable = isCountable(value);
  const reduced = useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
  const counted = useCountUp(countable ? value : 0, { duration, decimals });
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (countable && counted === value) setSettled(true);
  }, [countable, counted, value]);

  const animating = countable && !reduced && !settled;
  const { final, shown } = numberText(value, animating ? counted : (value ?? 0), format, fallback);

  if (final === shown) return <>{final}</>;
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{final}</span>
    </>
  );
}
