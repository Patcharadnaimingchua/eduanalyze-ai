'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export interface ConfirmOptions {
  title: string;
  description: ReactNode;
  confirmLabel: string;
}

// An awaitable stand-in for window.confirm: `await confirm({...})` resolves true
// on confirm and false on cancel, Esc or a click outside. Render `dialog` once
// in the component's output. A second call while one is open cancels the first.
export function useConfirm() {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);

  const settle = useCallback((answer: boolean) => {
    resolver.current?.(answer);
    resolver.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setPending(options);
    });
  }, []);

  const dialog = pending ? (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      title={pending.title}
      description={pending.description}
      confirmLabel={pending.confirmLabel}
      onConfirm={() => settle(true)}
    />
  ) : null;

  return { confirm, dialog };
}
