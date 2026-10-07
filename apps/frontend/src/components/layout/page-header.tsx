import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={cn('text-2xl font-semibold text-primary', titleClassName)}>{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
