'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOAST_ICON_CLASSES, TOAST_TONE_CLASSES, type ToastTone } from '@/lib/tone';

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  danger: AlertCircle,
  neutral: Info,
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
        TOAST_TONE_CLASSES[tone],
        leaving
          ? 'animate-out slide-out-to-right-full fade-out duration-200 fill-mode-forwards'
          : 'animate-in slide-in-from-right-full fade-in duration-300',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          TOAST_ICON_CLASSES[tone],
          tone === 'success' && 'animate-pop motion-reduce:animate-none',
        )}
      />
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
