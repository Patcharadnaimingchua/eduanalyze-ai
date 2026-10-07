import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TEXT_LABEL } from './instructor-ui';

// One figure of a summary row. Same height across the row; `big` is the lead
// tile; a zero is shown in the quiet colour and the unit stays small and faint.
// Put it inside a <dl>.
export function StatTile({
  label,
  value,
  unit,
  extra,
  big = false,
  zero = false,
  className,
}: Readonly<{
  label: string;
  value: ReactNode;
  unit?: string;
  extra?: ReactNode;
  big?: boolean;
  zero?: boolean;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        'flex h-full min-w-0 flex-col justify-between gap-2 rounded-lg border border-slate-200 p-4',
        big && 'bg-brand-light',
        className,
      )}
    >
      <dt className={TEXT_LABEL}>{label}</dt>
      <dd className="space-y-1">
        <p
          className={cn(
            'break-words font-bold leading-none tabular-nums',
            big ? 'text-5xl' : 'text-3xl',
            zero ? 'text-muted-foreground' : 'text-primary',
          )}
        >
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
      </dd>
    </div>
  );
}
