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
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { Reveal } from '@/components/layout/reveal';
import { UserRolesSection } from '@/components/admin/user-roles-section';
import { UserScopesSection } from '@/components/admin/user-scopes-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton';

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
        <div className="space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
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

      {userQuery.isLoading && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-48" />
          </div>
          <ListSkeleton items={3} />
        </div>
      )}
      {userQuery.isError && <PageLoadError message="ไม่พบผู้ใช้งาน หรือไม่มีสิทธิ์เข้าถึง" />}

      {userQuery.data && (
        <>
          <Reveal index={0}>
            <PageHeader
              title={userQuery.data.fullName}
              description={userQuery.data.email}
              actions={
                <Badge tone={userQuery.data.isActive ? 'success' : 'neutral'}>
                  {userQuery.data.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                </Badge>
              }
            />
          </Reveal>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Reveal index={1}>
            <Card>
              <CardHeader>
                <CardTitle>สถานะบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {userQuery.data.isActive
                      ? 'บัญชีนี้เข้าสู่ระบบได้ตามปกติ'
                      : 'บัญชีนี้ถูกระงับ ไม่สามารถเข้าสู่ระบบได้'}
                  </span>
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
          </Reveal>

          <Reveal index={2}>
            <UserRolesSection
              userId={userId}
              roles={userQuery.data.roles}
              requesterIsSuperAdmin={requesterIsSuperAdmin}
              isSelf={isSelf}
              onChanged={refetch}
            />
          </Reveal>

          <Reveal index={3}>
            <UserScopesSection
              userId={userId}
              scopes={userQuery.data.scopes}
              isSelf={isSelf}
              onChanged={refetch}
            />
          </Reveal>
        </>
      )}
    </DashboardShell>
  );
}
