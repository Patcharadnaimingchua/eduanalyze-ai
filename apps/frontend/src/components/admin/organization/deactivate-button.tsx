'use client';

import { useState } from 'react';
import { describeOrgWriteError } from './org-errors';
import { Button } from '@/components/ui/button';

// Client-side blockedReason is UX only; the backend's 409 is the authority.
export function DeactivateButton({
  blockedReason,
  conflictMessage,
  onConfirm,
}: {
  blockedReason?: string;
  conflictMessage: string;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setConfirming(false);
      setError(describeOrgWriteError(err, conflictMessage));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex gap-2">
          <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={handleConfirm}>
            ยืนยันปิดใช้งาน
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
            ยกเลิก
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!!blockedReason}
          title={blockedReason}
          onClick={() => setConfirming(true)}
        >
          ปิดใช้งาน
        </Button>
      )}
      {blockedReason && <p className="text-xs text-muted-foreground">{blockedReason}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
