'use client';

import { useState } from 'react';
import type { Role } from '@eduanalyze-ai/shared-types';
import { assignUserRole, revokeUserRole } from '@/lib/api/user-management';
import { ROLE_BADGE_TONE, ROLE_LABEL_TH } from '@/components/auth/require-role';
import { useToast } from '@/lib/toast-context';
import { MISSING_SCOPE_WARNING, roleNeedsScope } from '@/lib/user-scope-requirement';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RevokeButton } from './revoke-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// SUPER_ADMIN deliberately excluded — never grantable via API (advisor
// feedback, see plan file "เรื่องที่ 2"), backend rejects it with 403
// regardless of requester, so it's never offered here either.
const ALL_ASSIGNABLE_ROLES: Role[] = ['INSTRUCTOR', 'STAFF', 'ADMIN'];

export function UserRolesSection({
  userId,
  roles,
  hasScopes,
  requesterIsSuperAdmin,
  lockedReason,
  onChanged,
}: {
  userId: string;
  roles: Role[];
  hasScopes: boolean;
  requesterIsSuperAdmin: boolean;
  lockedReason: string | null;
  onChanged: () => void;
}) {
  const [confirmingRole, setConfirmingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const toast = useToast();

  // ADMIN may only assign/revoke STAFF (backend-enforced) — narrowing the
  // dropdown here means an ADMIN never even attempts (and gets 403'd by)
  // any other role.
  const availableRoles = (requesterIsSuperAdmin ? ALL_ASSIGNABLE_ROLES : (['STAFF'] as Role[])).filter(
    (role) => !roles.includes(role),
  );

  // Warn only — assigning stays allowed (backend keeps role and scope
  // independent, and a scope can be added right after).
  const warnMissingScope = !!selectedRole && !hasScopes && roleNeedsScope([selectedRole as Role]);

  async function handleAssign() {
    if (!selectedRole) return;
    if (
      warnMissingScope &&
      !window.confirm(`ผู้ใช้นี้ยังไม่มีขอบเขตความรับผิดชอบ\n${MISSING_SCOPE_WARNING}\n\nต้องการเพิ่มบทบาทต่อหรือไม่?`)
    ) {
      return;
    }
    setBusy(true);
    setServerError(null);
    try {
      await assignUserRole(userId, { role: selectedRole as Role });
      toast.success(`เพิ่มบทบาท ${ROLE_LABEL_TH[selectedRole as Role]} แล้ว`);
      setSelectedRole('');
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(role: Role) {
    setBusy(true);
    setServerError(null);
    try {
      await revokeUserRole(userId, role);
      toast.success(`ถอนบทบาท ${ROLE_LABEL_TH[role]} แล้ว`);
      setConfirmingRole(null);
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>บทบาท</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีบทบาท</p>
        ) : (
          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2"
              >
                <Badge tone={ROLE_BADGE_TONE[role]}>{ROLE_LABEL_TH[role]}</Badge>
                {lockedReason ? (
                  <span className="text-xs text-muted-foreground">{lockedReason}</span>
                ) : (
                  <RevokeButton label="ถอดบทบาท" onClick={() => setConfirmingRole(role)} />
                )}
              </li>
            ))}
          </ul>
        )}

        {!lockedReason && availableRoles.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
            <div className="w-full sm:w-56">
              <Select value={selectedRole || undefined} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="เพิ่มบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role} className="min-h-11">
                      {ROLE_LABEL_TH[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" className="min-h-11" disabled={!selectedRole || busy} onClick={handleAssign}>
              เพิ่มบทบาท
            </Button>
          </div>
        )}
        {warnMissingScope && (
          <p className="text-xs text-amber-700" role="status">
            ผู้ใช้นี้ยังไม่มีขอบเขต — {MISSING_SCOPE_WARNING} (เพิ่มได้ที่การ์ด &ldquo;ขอบเขต&rdquo; ด้านล่าง)
          </p>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmingRole !== null}
        onOpenChange={(open) => !open && setConfirmingRole(null)}
        title={confirmingRole ? `ถอดบทบาท${ROLE_LABEL_TH[confirmingRole]}?` : ''}
        description={
          confirmingRole
            ? `ผู้ใช้นี้จะไม่มีบทบาท${ROLE_LABEL_TH[confirmingRole]}อีกต่อไป และใช้งานส่วนของบทบาทนี้ไม่ได้ทันที`
            : ''
        }
        confirmLabel="ถอดบทบาท"
        busy={busy}
        onConfirm={() => confirmingRole && handleRevoke(confirmingRole)}
      />
    </Card>
  );
}
