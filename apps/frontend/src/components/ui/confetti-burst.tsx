'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

const PIECE_COUNT = 24;
const COLORS = ['bg-brand', 'bg-amber-400', 'bg-emerald-500', 'bg-sky-400', 'bg-rose-400'];
const DURATION_MS = 1400;
const MAX_STAGGER_MS = 150;

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Pure-CSS burst from the center of the nearest positioned ancestor. Each
// piece gets its own --x/--y/--r, read by the `confetti` keyframe in
// tailwind.config.ts. Unmounts itself once the last piece has landed.
export function ConfettiBurst({ delayMs = 0 }: Readonly<{ delayMs?: number }>) {
  const [pieces] = useState(() =>
    Array.from({ length: PIECE_COUNT }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      style: {
        '--x': `${between(-120, 120)}px`,
        '--y': `${between(-110, -40)}px`,
        '--r': `${between(-540, 540)}deg`,
        animationDelay: `${delayMs + between(0, MAX_STAGGER_MS)}ms`,
      } as CSSProperties,
    })),
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), delayMs + MAX_STAGGER_MS + DURATION_MS);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (done) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={cn('absolute left-1/2 top-1/2 h-2 w-1.5 animate-confetti rounded-[1px]', piece.color)}
          style={piece.style}
        />
      ))}
    </div>
  );
}
