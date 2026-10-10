'use client';

import { useState } from 'react';
import type { AdminUserSummary } from '@eduanalyze-ai/shared-types';
import { resendInvitation } from '@/lib/api/user-management';
import { canResendInvitation, describeResendError } from '@/lib/resend-invitation';
import { useToast } from '@/lib/toast-context';
import { ApiErrorAlert } from '@/components/admin/api-error-alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Emails a fresh password-setup link to an account that has not set a password
// yet. Renders nothing when the API would refuse, so it is never a dead button.
export function ResendInvitationButton({
  user,
  requesterId,
  requesterIsSuperAdmin,
  errorPlacement = 'inline',
}: Readonly<{
  user: AdminUserSummary;
  requesterId: string;
  requesterIsSuperAdmin: boolean;
  // Table rows have no room for a block under the button, so they use a toast.
  errorPlacement?: 'inline' | 'toast';
}>) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canResendInvitation({ isSelf: user.id === requesterId, requesterIsSuperAdmin, user })) {
    return null;
  }

  // Flow that writes: POST /users/:id/resend-invitation
  async function send() {
    setBusy(true);
    setError(null);
    try {
      await resendInvitation(user.id);
      toast.success('ส่งอีเมลแล้ว');
    } catch (err) {
      const message = describeResendError(err);
      if (errorPlacement === 'toast') toast.error(message);
      else setError(message);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="outline"
        className="px-3"
        disabled={busy}
        aria-label={`ส่งคำเชิญซ้ำให้ ${user.fullName}`}
        onClick={() => setConfirming(true)}
      >
        ส่งคำเชิญซ้ำ
      </Button>
      {error && <ApiErrorAlert message={error} onDismiss={() => setError(null)} />}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`ส่งคำเชิญซ้ำให้ ${user.fullName}?`}
        description={
          <>
            <p>ระบบจะส่งอีเมลลิงก์ตั้งรหัสผ่านใหม่ไปที่ {user.email}</p>
            <p className="mt-2">
              ลิงก์เดิมที่ยังไม่ได้ใช้จะใช้งานไม่ได้อีก และลิงก์ใหม่หมดอายุใน 1 ชั่วโมง
            </p>
          </>
        }
        confirmLabel="ส่งอีเมล"
        confirmVariant="default"
        busy={busy}
        onConfirm={() => void send()}
      />
    </span>
  );
}
