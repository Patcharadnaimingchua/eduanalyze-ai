'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminUserSummary } from '@eduanalyze-ai/shared-types';
import { suspendBlockReason } from '@/lib/admin-user-guard';
import { updateUserActiveStatus } from '@/lib/api/user-management';
import { describeApiError } from '@/lib/describe-api-error';
import { useToast } from '@/lib/toast-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Suspend or reactivate straight from the Super Admin's list. When the rules
// forbid it the button is replaced by the reason, never left clickable.
export function UserStatusAction({
  user,
  requesterId,
}: Readonly<{ user: AdminUserSummary; requesterId: string }>) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const blockReason = suspendBlockReason({
    isSelf: user.id === requesterId,
    requesterIsSuperAdmin: true,
    targetRoles: user.roles,
    targetScopes: user.scopes,
    ownScopes: null,
    org: null,
  });

  if (blockReason) {
    return (
      <div className="space-y-1" role="note">
        <Badge tone="neutral" className="whitespace-normal">
          จัดการไม่ได้จากหน้านี้
        </Badge>
        <p className="text-xs text-muted-foreground">{blockReason}</p>
      </div>
    );
  }

  async function toggle() {
    setBusy(true);
    try {
      await updateUserActiveStatus(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'ระงับการใช้งานบัญชีแล้ว' : 'เปิดใช้งานบัญชีอีกครั้งแล้ว');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      toast.error(describeApiError(error));
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
        className="min-h-11"
        disabled={busy}
        onClick={() => (user.isActive ? setConfirming(true) : void toggle())}
      >
        {user.isActive ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`ระงับบัญชีของ ${user.fullName}?`}
        description={
          <>
            <p>
              {user.fullName} ({user.email}) จะเข้าสู่ระบบไม่ได้ทันที
              และเซสชันที่ใช้งานอยู่จะใช้งานต่อไม่ได้
            </p>
            <p className="mt-2">เปิดใช้งานอีกครั้งได้ภายหลังจากหน้านี้</p>
          </>
        }
        confirmLabel="ระงับบัญชี"
        busy={busy}
        onConfirm={() => void toggle()}
      />
    </>
  );
}
