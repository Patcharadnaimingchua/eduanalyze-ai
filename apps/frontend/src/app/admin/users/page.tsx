'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateUserResponse } from '@eduanalyze-ai/shared-types';
import { fetchUsers } from '@/lib/api/user-management';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { UserListTable } from '@/components/admin/user-list-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const requesterIsSuperAdmin = user.roles.includes('SUPER_ADMIN');

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
      <div>
        <h1 className="text-2xl font-semibold text-primary">ผู้ใช้งาน</h1>
        <p className="text-sm text-muted-foreground">
          จัดการบัญชีอาจารย์ เจ้าหน้าที่ และผู้ดูแลระบบ
        </p>
      </div>

      {createdUser ? (
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
      ) : (
        <CreateUserForm requesterIsSuperAdmin={requesterIsSuperAdmin} onCreated={setCreatedUser} />
      )}

      {usersQuery.isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      {usersQuery.isError && (
        <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      )}
      {usersQuery.data && <UserListTable users={usersQuery.data} />}
    </DashboardShell>
  );
}
