import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  className?: string;
  barClassName?: string;
}

export function Progress({ value, label, className, barClassName }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
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
        className={cn('h-full rounded-full bg-primary transition-all', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
