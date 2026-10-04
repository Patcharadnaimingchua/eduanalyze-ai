'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const MAX_TILT_DEG = 6;
const PERSPECTIVE_PX = 900;

// Pointer-driven 3D tilt for one or two headline cards. Only a real mouse
// (hover: hover + pointer: fine) tilts it: touch, pen-less tablets and
// prefers-reduced-motion get the plain wrapper with no listeners at all. The
// transform is written straight to the element (no React state, no re-render)
// and only rotates, so the layout never shifts. Keep it INSIDE Reveal, whose
// entrance animation owns the outer element's transform, and around — never
// inside — the card's Link so focus ring and click target are untouched.
export function TiltCard({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!canTilt.matches || reduced.matches) return;

    let frame = 0;
    let rect: DOMRect | null = null;
    let restTimer: ReturnType<typeof setTimeout> | undefined;

    // The bounding box is cached on enter: re-measuring a rotated element on
    // every move would feed the tilt back into its own hit area.
    const measure = () => {
      rect = el.getBoundingClientRect();
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      clearTimeout(restTimer);
      el.style.willChange = 'transform';
      el.style.transition = 'transform 120ms ease-out';
      measure();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !rect) return;
      const { clientX, clientY } = e;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!rect) return;
        const px = (clientX - rect.left) / rect.width - 0.5;
        const py = (clientY - rect.top) / rect.height - 0.5;
        const rotY = Math.max(-1, Math.min(1, px * 2)) * MAX_TILT_DEG;
        const rotX = Math.max(-1, Math.min(1, py * 2)) * -MAX_TILT_DEG;
        el.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      rect = null;
      el.style.transition = 'transform 300ms ease-out';
      el.style.transform = '';
      restTimer = setTimeout(() => {
        el.style.willChange = '';
      }, 320);
    };

    const invalidate = () => {
      if (rect) measure();
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(restTimer);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      el.style.transform = '';
      el.style.transition = '';
      el.style.willChange = '';
    };
  }, []);

  return (
    <div ref={ref} className={cn('h-full', className)}>
      {children}
    </div>
  );
}
