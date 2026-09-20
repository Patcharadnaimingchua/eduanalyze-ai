'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Toast, type ToastTone } from '@/components/ui/toast';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  leaving: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS: Record<ToastTone, number> = {
  success: 4000,
  info: 4000,
  // Errors stay longer — they carry more to read and usually mean the user
  // has to decide whether to retry.
  error: 8000,
};

// Keeps a burst of writes (e.g. the roster's per-row saves) from stacking
// into a wall of toasts.
const MAX_VISIBLE = 4;
// Must match the exit animation duration in toast.tsx.
const EXIT_ANIMATION_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      // Mark leaving first so the node stays mounted long enough to play its
      // exit animation, then drop it for real.
      setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      const timer = setTimeout(() => remove(id), EXIT_ANIMATION_MS);
      timersRef.current.set(id, timer);
    },
    [remove],
  );

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextIdRef.current++;
      setToasts((current) => [...current, { id, tone, message, leaving: false }].slice(-MAX_VISIBLE));
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS[tone]);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const success = useCallback((message: string) => show('success', message), [show]);
  const error = useCallback((message: string) => show('error', message), [show]);
  const info = useCallback((message: string) => show('info', message), [show]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // Two regions, not one: an error has to interrupt a screen reader, a
  // success must not.
  const polite = toasts.filter((t) => t.tone !== 'error');
  const assertive = toasts.filter((t) => t.tone === 'error');

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          {polite.map((t) => (
            <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex flex-col gap-2">
          {assertive.map((t) => (
            <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
