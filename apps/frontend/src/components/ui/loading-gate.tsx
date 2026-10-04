'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Slightly longer than the 200ms fade so the unmount never cuts it short.
const SKELETON_UNMOUNT_MS = 250;

// Cross-fades a loading skeleton into the real content. The skeleton stays
// mounted for a moment after `ready` flips, turns into an absolute overlay that
// fades out, and the content (with its own Reveal entrance) mounts underneath.
// Layout notes:
//  - the content slot comes first and the wrapper re-applies the shell's
//    `space-y-6`, so content spacing is exactly what it was without the gate;
//  - the overlay gets `!mt-0` (space-y would otherwise offset it as a later
//    sibling) and is clipped to the content's height, so a taller skeleton
//    cannot stretch the page;
//  - it is the same DOM node before and after `ready`, so the shimmer does not
//    restart.
// If data is already there on first render (cache hit) no skeleton is shown at
// all. Callers should pass a `ready` that follows isLoading, not isFetching.
export function LoadingGate({
  ready,
  skeleton,
  children,
}: Readonly<{ ready: boolean; skeleton: ReactNode; children: ReactNode }>) {
  const [skeletonMounted, setSkeletonMounted] = useState(!ready);

  useEffect(() => {
    if (!ready) {
      setSkeletonMounted(true);
      return;
    }
    if (!skeletonMounted) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSkeletonMounted(false);
      return;
    }
    // A timer rather than animationend, which never fires if animations are off.
    const timer = setTimeout(() => setSkeletonMounted(false), SKELETON_UNMOUNT_MS);
    return () => clearTimeout(timer);
  }, [ready, skeletonMounted]);

  const leaving = ready;

  return (
    <div className="relative space-y-6">
      {ready && children}
      {(!ready || skeletonMounted) && (
        <div
          aria-hidden={leaving || undefined}
          className={cn(
            leaving &&
              'pointer-events-none absolute inset-0 !mt-0 overflow-hidden animate-out fade-out-0 fill-mode-forwards duration-200 motion-reduce:hidden',
          )}
        >
          {skeleton}
        </div>
      )}
    </div>
  );
}
