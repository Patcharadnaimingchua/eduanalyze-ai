import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Centered block variant — matches the pattern previously duplicated in
// plo-radar-chart.tsx / course-insight-card.tsx (icon size 28, muted slate).
export function EmptyState({
  icon: Icon,
  description,
  className,
}: {
  icon: LucideIcon;
  description: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-8 text-center', className)}>
      <Icon size={28} className="text-slate-300" aria-hidden="true" />
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// Dashed-border row variant — matches the pattern previously duplicated in
// elective-category-list.tsx (icon + paragraph side by side).
export function InlineNotice({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
