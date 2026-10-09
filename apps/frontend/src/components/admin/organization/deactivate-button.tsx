'use client';

import { useState } from 'react';
import { describeOrgWriteError } from './org-errors';
import { DeactivateConfirm } from '@/components/admin/deactivate-confirm';
import { Button } from '@/components/ui/button';

// Client-side blockedReason is UX only; the backend's 409 is the authority.
export function DeactivateButton({
  itemLabel,
  blockedReason,
  conflictMessage,
  onConfirm,
}: {
  // Names the item in the dialog, e.g. "คณะวิศวกรรมศาสตร์".
  itemLabel: string;
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
      setError(describeOrgWriteError(err, conflictMessage));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={!!blockedReason}
        title={blockedReason}
        onClick={() => setConfirming(true)}
      >
        ปิดใช้งาน
      </Button>
      {blockedReason && <p className="text-xs text-muted-foreground">{blockedReason}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <DeactivateConfirm
        open={confirming}
        onOpenChange={setConfirming}
        itemLabel={itemLabel}
        busy={busy}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
