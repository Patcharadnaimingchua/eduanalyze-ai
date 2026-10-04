'use client';

import type { ReactNode } from 'react';
import { useInView } from '@/lib/use-in-view';
import { cn } from '@/lib/utils';

// Same entrance as Reveal, but it waits until the block is scrolled into view.
// For blocks below the fold only: nothing here replaces Reveal's index
// stagger, so keep using Reveal for the top of a page. Use it only for blocks
// that mount after client-side data loads — the pending (hidden) state is
// applied on the first client render, so putting it in server-rendered HTML
// would paint content invisible until hydration.
export function RevealOnScroll({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        seen
          ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none'
          : 'reveal-pending',
        className,
      )}
      style={{ animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}
