'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateUserResponse } from '@eduanalyze-ai/shared-types';
import { fetchUsers } from '@/lib/api/user-management';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { Reveal } from '@/components/layout/reveal';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { UserListTable } from '@/components/admin/user-list-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute>
      <RequireRole role={['SUPER_ADMIN', 'ADMIN']}>
        <AdminUsersContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  const requesterIsSuperAdmin = user.roles.includes('SUPER_ADMIN');

  function handleCreated(result: CreateUserResponse) {
    setCreatedUser(result);
    setShowCreateForm(false);
  }

  function handleAcknowledge() {
    setCreatedUser(null);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }

  return (
    <DashboardShell
      role={requesterIsSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'}
      identityLabel={user.email}
      fullName={user.fullName}
    >
      <Reveal index={0}>
        <PageHeader
          title="ผู้ใช้งาน"
          description="จัดการบัญชีอาจารย์ เจ้าหน้าที่ และผู้ดูแลระบบ"
          actions={
            !createdUser && (
              <Button
                type="button"
                variant={showCreateForm ? 'outline' : 'default'}
                className="gap-1.5"
                onClick={() => setShowCreateForm((open) => !open)}
              >
                {showCreateForm ? (
                  'ยกเลิก'
                ) : (
                  <>
                    <Plus size={16} />
                    สร้างบัญชี
                  </>
                )}
              </Button>
            )
          }
        />
      </Reveal>

      {createdUser && (
        <Card className={createdUser.passwordSetupEmailSent ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="space-y-4 pt-6">
            <p className={`text-sm font-medium ${createdUser.passwordSetupEmailSent ? 'text-emerald-900' : 'text-amber-900'}`}>
              สร้างบัญชีสำเร็จ — {createdUser.fullName} ({createdUser.email})
            </p>
            {createdUser.passwordSetupEmailSent ? (
              <Alert>
                <AlertDescription>
                  ระบบส่งอีเมลตั้งรหัสผ่านให้ {createdUser.email} แล้ว — ผู้ใช้จะได้รับลิงก์สำหรับตั้งรหัสผ่านของตัวเอง
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  ส่งอีเมลไม่สำเร็จ (ระบบส่งอีเมลขัดข้อง) — บัญชีถูกสร้างแล้ว แจ้งให้ผู้ใช้กด &ldquo;ลืมรหัสผ่าน&rdquo;
                  ที่หน้าเข้าสู่ระบบด้วยอีเมล {createdUser.email} เพื่อตั้งรหัสผ่านเอง
                </AlertDescription>
              </Alert>
            )}
            <Button type="button" onClick={handleAcknowledge}>
              รับทราบ ปิดหน้าต่างนี้
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreateForm && !createdUser && (
        <Reveal>
          <CreateUserForm requesterIsSuperAdmin={requesterIsSuperAdmin} onCreated={handleCreated} />
        </Reveal>
      )}

      <Reveal index={1}>
        {usersQuery.isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>รายชื่อผู้ใช้งาน</CardTitle>
            </CardHeader>
            <CardContent>
              <TableSkeleton cols={4} rows={6} />
            </CardContent>
          </Card>
        )}
        {usersQuery.isError && <PageLoadError />}
        {usersQuery.data && <UserListTable users={usersQuery.data} />}
      </Reveal>
    </DashboardShell>
  );
}
