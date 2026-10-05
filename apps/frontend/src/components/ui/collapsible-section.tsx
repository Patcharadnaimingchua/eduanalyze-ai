import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Native <details>: keyboard and screen-reader toggling for free, no state, no
// library. `framed` makes the whole section one card with the content inside;
// unframed, only the summary bar looks like a card and the content (usually
// cards of its own) stacks below it, so cards are never nested.
export function CollapsibleSection({
  title,
  meta,
  defaultOpen = false,
  framed = true,
  children,
}: Readonly<{
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  framed?: boolean;
  children: ReactNode;
}>) {
  const card = 'rounded-lg border bg-card text-card-foreground shadow-sm';
  return (
    <details open={defaultOpen} className={cn('group', framed && card)}>
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-6 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden',
          !framed && card,
        )}
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-base font-semibold">
          {title}
          {meta}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className={framed ? 'px-6 pb-6' : 'mt-4 space-y-4'}>{children}</div>
    </details>
  );
}
