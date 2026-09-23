import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const STAGGER_MS = 75;

// Page-load entrance for top-level blocks. Convention: the page header is
// index 0 (animated or not), content blocks count up from 1.
// animationFillMode 'both' keeps a block hidden until its own delay starts —
// without it every block flashes in at once, then animates.
export function Reveal({
  index = 0,
  className,
  children,
}: Readonly<{ index?: number; className?: string; children: ReactNode }>) {
  return (
    <div
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none',
        className,
      )}
      style={{ animationDelay: `${index * STAGGER_MS}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}
