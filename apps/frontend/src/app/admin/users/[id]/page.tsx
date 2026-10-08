'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchUser, updateUserActiveStatus } from '@/lib/api/user-management';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { fetchDepartments, fetchPrograms } from '@/lib/api/organization';
import { manageLockReason, suspendBlockReason } from '@/lib/admin-user-guard';
import { MISSING_SCOPE_WARNING, roleNeedsScope } from '@/lib/user-scope-requirement';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const [confirmingSuspend, setConfirmingSuspend] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const toast = useToast();

  const userQuery = useQuery({
    queryKey: ['admin-users', userId],
    queryFn: () => fetchUser(userId),
  });

  const needsCoverageCheck = !!requester && !requester.roles.includes('SUPER_ADMIN');
  const ownUserQuery = useQuery({
    queryKey: ['admin-users', requester?.userId],
    queryFn: () => fetchUser(requester!.userId),
    enabled: needsCoverageCheck,
  });
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    enabled: needsCoverageCheck,
  });
  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    enabled: needsCoverageCheck,
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

  const roleScopeLockReason = userQuery.data
    ? manageLockReason({ isSelf, requesterIsSuperAdmin, targetRoles: userQuery.data.roles })
    : null;
  const org =
    departmentsQuery.data && programsQuery.data
      ? { departments: departmentsQuery.data, programs: programsQuery.data }
      : null;
  const suspendBlocked =
    userQuery.data && userQuery.data.isActive
      ? suspendBlockReason({
          isSelf,
          requesterIsSuperAdmin,
          targetRoles: userQuery.data.roles,
          targetScopes: userQuery.data.scopes,
          ownScopes: ownUserQuery.data?.scopes ?? null,
          org,
        })
      : roleScopeLockReason;

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
      toast.success(userQuery.data.isActive ? 'ระงับการใช้งานบัญชีแล้ว' : 'เปิดใช้งานบัญชีอีกครั้งแล้ว');
      setConfirmingSuspend(false);
      refetch();
    } catch (err) {
      const message =
        (err as { response?: { status?: number; data?: { message?: string } } }).response?.status === 403
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'ไม่มีสิทธิ์ดำเนินการนี้')
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setConfirmingSuspend(false);
      setServerError(message);
      toast.error(message);
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
      {userQuery.isError && (
        <PageLoadError
          message="ไม่พบผู้ใช้งาน หรือไม่มีสิทธิ์เข้าถึง"
          onRetry={() => userQuery.refetch()}
        />
      )}

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

          {roleNeedsScope(userQuery.data.roles) && userQuery.data.scopes.length === 0 && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertDescription>
                ผู้ใช้นี้ยังไม่มีขอบเขตความรับผิดชอบ — {MISSING_SCOPE_WARNING}{' '}
                <a href="#user-scopes" className="font-medium underline">
                  ไปที่การกำหนดขอบเขต
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Reveal index={1}>
            <Card>
              <CardHeader>
                <CardTitle>สถานะบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {userQuery.data.isActive
                      ? 'บัญชีนี้เข้าสู่ระบบได้ตามปกติ'
                      : 'บัญชีนี้ถูกระงับ ไม่สามารถเข้าสู่ระบบได้'}
                  </span>
                  {suspendBlocked ? (
                    <span className="max-w-md text-xs text-muted-foreground" role="note">
                      {suspendBlocked}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      disabled={busy}
                      onClick={() =>
                        userQuery.data.isActive ? setConfirmingSuspend(true) : handleToggleActive()
                      }
                    >
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
              hasScopes={userQuery.data.scopes.length > 0}
              requesterIsSuperAdmin={requesterIsSuperAdmin}
              lockedReason={roleScopeLockReason}
              onChanged={refetch}
            />
          </Reveal>

          <Reveal index={3}>
            <div id="user-scopes" className="scroll-mt-6">
            <UserScopesSection
              userId={userId}
              scopes={userQuery.data.scopes}
              lockedReason={roleScopeLockReason}
              onChanged={refetch}
            />
            </div>
          </Reveal>
        </>
      )}

      {userQuery.data && (
        <ConfirmDialog
          open={confirmingSuspend}
          onOpenChange={setConfirmingSuspend}
          title={`ระงับบัญชีของ ${userQuery.data.fullName}?`}
          description={
            <>
              <p>
                {userQuery.data.fullName} ({userQuery.data.email}) จะเข้าสู่ระบบไม่ได้ทันที
                และเซสชันที่ใช้งานอยู่จะใช้งานต่อไม่ได้
              </p>
              <p className="mt-2">เปิดใช้งานอีกครั้งได้ภายหลังจากหน้านี้</p>
            </>
          }
          confirmLabel="ระงับบัญชี"
          busy={busy}
          onConfirm={handleToggleActive}
        />
      )}
    </DashboardShell>
  );
}
