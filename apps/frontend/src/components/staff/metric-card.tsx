import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

// One figure, what it counts, and one line saying what it is counted over.
export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  unit?: string;
  note: ReactNode;
}>) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light">
          <Icon aria-hidden="true" size={18} className="text-brand" />
        </span>
      </div>
      <p className="break-words text-3xl font-bold tabular-nums text-primary">
        {value}
        {unit && <span className="ml-1.5 text-base font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p className="break-words rounded-md bg-slate-50 px-3 py-2 text-sm text-muted-foreground">{note}</p>
    </Card>
  );
}
