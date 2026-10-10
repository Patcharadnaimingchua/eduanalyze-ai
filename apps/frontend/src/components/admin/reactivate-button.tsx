'use client';

import { useState } from 'react';
import { describeApiError } from '@/lib/describe-api-error';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// "เปิดใช้งานอีกครั้ง" for one deactivated record. Restoring is not destructive, so
// the confirm button is the plain one; the dialog says what comes back and what does not.
// The API's own Thai 409 (parent still closed, key taken) is passed up as the message.
export function ReactivateButton({
  itemLabel,
  onConfirm,
  onError,
}: Readonly<{
  itemLabel: string;
  onConfirm: () => Promise<void>;
  onError: (message: string) => void;
}>) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (error) {
      onError(describeApiError(error));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`เปิดใช้งาน${itemLabel}อีกครั้ง`}
        onClick={() => setConfirming(true)}
      >
        เปิดใช้งานอีกครั้ง
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`เปิดใช้งาน${itemLabel}อีกครั้ง?`}
        description={
          <div className="space-y-2">
            <p>รายการนี้จะกลับมาใช้งานตามเดิม ข้อมูลที่เคยผูกไว้ยังอยู่ครบ</p>
            <p>รายการย่อยที่ถูกปิดไปพร้อมกันจะยังปิดอยู่ ต้องเปิดแยกทีละรายการ</p>
          </div>
        }
        confirmLabel="เปิดใช้งาน"
        confirmVariant="default"
        busy={busy}
        onConfirm={handleConfirm}
      />
    </>
  );
}
