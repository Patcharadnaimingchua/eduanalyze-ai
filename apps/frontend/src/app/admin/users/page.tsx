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
import { TempPasswordReveal } from '@/components/admin/temp-password-reveal';
import { UserListTable } from '@/components/admin/user-list-table';

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
        <TempPasswordReveal
          fullName={createdUser.fullName}
          email={createdUser.email}
          tempPassword={createdUser.tempPassword}
          onAcknowledge={handleAcknowledge}
        />
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
