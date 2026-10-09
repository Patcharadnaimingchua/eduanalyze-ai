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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Suspend or reactivate straight from the Super Admin's list. When the rules
// forbid it the button is replaced by the reason, never left clickable.
export function UserStatusAction({
  user,
  requesterId,
  compact = false,
  showReason = false,
}: Readonly<{
  user: AdminUserSummary;
  requesterId: string;
  // Table rows: shorter button label so the actions stay on one line.
  compact?: boolean;
  // Cards have room to write the reason out; table rows keep it in a tooltip.
  showReason?: boolean;
}>) {
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
      <span className="inline-flex flex-col items-start gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge tone="neutral" className="whitespace-nowrap">
                จัดการไม่ได้
              </Badge>
              {!showReason && <span className="sr-only">{blockReason}</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{blockReason}</TooltipContent>
        </Tooltip>
        {showReason && <span className="text-xs text-muted-foreground">{blockReason}</span>}
      </span>
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
        className="h-11 px-3"
        disabled={busy}
        aria-label={`${user.isActive ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}บัญชีของ ${user.fullName}`}
        onClick={() => (user.isActive ? setConfirming(true) : void toggle())}
      >
        {user.isActive ? (compact ? 'ระงับ' : 'ระงับการใช้งาน') : 'เปิดใช้งาน'}
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
