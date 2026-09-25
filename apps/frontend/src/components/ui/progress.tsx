'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  className?: string;
  barClassName?: string;
}

export function Progress({ value, label, className, barClassName }: Readonly<ProgressProps>) {
  const clamped = Math.max(0, Math.min(100, value));
  // First paint at 0 so the width transition has somewhere to fill from.
  // Callers that already animate `value` themselves pass `transition-none`.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-[width] duration-700 ease-out', barClassName)}
        style={{ width: `${filled ? clamped : 0}%` }}
      />
    </div>
  );
}
