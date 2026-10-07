import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0-100; both the arc and the centre text are clamped to it
  label: string;
  // 'neutral' keeps a full ring from reading as "done" (green).
  tone?: 'default' | 'neutral';
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

// Presentational only: the arc follows `value` directly with no transition of
// its own. Callers feed it a useCountUp() value so the arc and the centre %
// move in lock-step, and that hook already honours prefers-reduced-motion.
// pathLength={100} lets the dash maths work in plain percent.
export function ProgressRing({
  value,
  label,
  tone = 'default',
  size = 88,
  strokeWidth = 8,
  className,
  children,
}: Readonly<ProgressRingProps>) {
  const safe = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(100, safe));
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        strokeWidth={strokeWidth}
        className="-rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx={center} cy={center} r={radius} className="stroke-slate-100" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={100 - clamped}
          strokeLinecap="round"
          className={cn(
            'transition-none motion-reduce:transition-none',
            tone === 'neutral'
              ? 'stroke-slate-500'
              : clamped >= 100
                ? 'stroke-emerald-600'
                : 'stroke-primary',
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums text-primary">
        {children ?? `${Math.round(clamped)}%`}
      </div>
    </div>
  );
}
