'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchUser, updateUserActiveStatus } from '@/lib/api/user-management';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { UserRolesSection } from '@/components/admin/user-roles-section';
import { UserScopesSection } from '@/components/admin/user-scopes-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <RequireRole role={['SUPER_ADMIN', 'ADMIN']}>
        <AdminUserDetailContent userId={params.id} />
      </RequireRole>
    </ProtectedRoute>
  );
}

function AdminUserDetailContent({ userId }: { userId: string }) {
  const { user: requester } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const userQuery = useQuery({
    queryKey: ['admin-users', userId],
    queryFn: () => fetchUser(userId),
  });

  if (!requester) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const requesterIsSuperAdmin = requester.roles.includes('SUPER_ADMIN');
  const isSelf = requester.userId === userId;

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ['admin-users', userId] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }

  async function handleToggleActive() {
    if (!userQuery.data) return;
    setBusy(true);
    setServerError(null);
    try {
      await updateUserActiveStatus(userId, { isActive: !userQuery.data.isActive });
      refetch();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell
      role={requesterIsSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'}
      identityLabel={requester.email}
      fullName={requester.fullName}
    >
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        กลับไปรายชื่อผู้ใช้งาน
      </Link>

      {userQuery.isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      {userQuery.isError && (
        <p className="text-sm text-destructive">ไม่พบผู้ใช้งาน หรือไม่มีสิทธิ์เข้าถึง</p>
      )}

      {userQuery.data && (
        <>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลบัญชี</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-medium text-primary">{userQuery.data.fullName}</p>
                <p className="text-sm text-muted-foreground">{userQuery.data.email}</p>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">สถานะบัญชี:</span>
                  <Badge tone={userQuery.data.isActive ? 'green' : 'gray'}>
                    {userQuery.data.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                  </Badge>
                </div>
                {isSelf ? (
                  <span className="text-xs text-muted-foreground">ไม่สามารถแก้ไขบัญชีของตัวเองที่นี่</span>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleToggleActive}>
                    {userQuery.data.isActive ? 'ระงับการใช้งาน' : 'เปิดใช้งานอีกครั้ง'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <UserRolesSection
            userId={userId}
            roles={userQuery.data.roles}
            requesterIsSuperAdmin={requesterIsSuperAdmin}
            isSelf={isSelf}
            onChanged={refetch}
          />

          <UserScopesSection
            userId={userId}
            scopes={userQuery.data.scopes}
            isSelf={isSelf}
            onChanged={refetch}
          />
        </>
      )}
    </DashboardShell>
  );
}
