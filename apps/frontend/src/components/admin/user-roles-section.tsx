'use client';

import { useState } from 'react';
import type { Role } from '@eduanalyze-ai/shared-types';
import { assignUserRole, revokeUserRole } from '@/lib/api/user-management';
import { ROLE_LABEL_TH } from '@/components/auth/require-role';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_BADGE_TONE: Record<Role, BadgeTone> = {
  STUDENT: 'gray',
  INSTRUCTOR: 'green',
  STAFF: 'gray',
  ADMIN: 'amber',
  SUPER_ADMIN: 'red',
};

const ALL_ASSIGNABLE_ROLES: Role[] = ['INSTRUCTOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN'];

export function UserRolesSection({
  userId,
  roles,
  requesterIsSuperAdmin,
  isSelf,
  onChanged,
}: {
  userId: string;
  roles: Role[];
  requesterIsSuperAdmin: boolean;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [confirmingRole, setConfirmingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ADMIN may only assign/revoke STAFF (backend-enforced) — narrowing the
  // dropdown here means an ADMIN never even attempts (and gets 403'd by)
  // any other role.
  const availableRoles = (requesterIsSuperAdmin ? ALL_ASSIGNABLE_ROLES : (['STAFF'] as Role[])).filter(
    (role) => !roles.includes(role),
  );

  async function handleAssign() {
    if (!selectedRole) return;
    setBusy(true);
    setServerError(null);
    try {
      await assignUserRole(userId, { role: selectedRole as Role });
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
        <CardTitle className="text-base">บทบาท</CardTitle>
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
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
              >
                <Badge tone={ROLE_BADGE_TONE[role]}>{ROLE_LABEL_TH[role]}</Badge>
                {isSelf ? (
                  <span className="text-xs text-muted-foreground">ไม่สามารถแก้ไขบัญชีของตัวเองที่นี่</span>
                ) : confirmingRole === role ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleRevoke(role)}
                    >
                      ยืนยัน
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingRole(null)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingRole(role)}>
                    ลบ
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {availableRoles.length > 0 && (
          <div className="flex items-end gap-3 border-t border-slate-100 pt-3">
            <div className="w-56">
              <Select value={selectedRole || undefined} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="เพิ่มบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABEL_TH[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" size="sm" disabled={!selectedRole || busy} onClick={handleAssign}>
              เพิ่มบทบาท
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
