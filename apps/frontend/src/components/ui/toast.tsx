'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

// Same palette vocabulary as badge.tsx — no new color language in the app.
const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-slate-50 text-slate-700 border-slate-200',
};

const TONE_ICON_CLASSES: Record<ToastTone, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-slate-500',
};

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function Toast({
  tone,
  message,
  leaving,
  onDismiss,
}: {
  tone: ToastTone;
  message: string;
  leaving: boolean;
  onDismiss: () => void;
}) {
  const Icon = TONE_ICONS[tone];

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-2.5 rounded-lg border p-3 shadow-md',
        TONE_CLASSES[tone],
        leaving
          ? 'animate-out slide-out-to-right-full fade-out duration-200 fill-mode-forwards'
          : 'animate-in slide-in-from-right-full fade-in duration-300',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_ICON_CLASSES[tone])} />
      <p className="flex-1 text-sm">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="ปิดการแจ้งเตือน"
        className="shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
