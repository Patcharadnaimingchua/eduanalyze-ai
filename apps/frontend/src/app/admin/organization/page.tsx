'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { OrgTree } from '@/components/admin/organization/org-tree';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationAdminPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="SUPER_ADMIN">
        <OrganizationAdminContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function OrganizationAdminContent() {
  const { user } = useAuth();

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

  return (
    <DashboardShell role="SUPER_ADMIN" identityLabel={user.email} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">โครงสร้างองค์กร</h1>
        <p className="text-sm text-muted-foreground">
          จัดการคณะ ภาควิชา สาขา และหลักสูตร — การปิดใช้งานทำได้เมื่อไม่มีข้อมูลที่ใช้งานอยู่ภายใต้รายการนั้น
        </p>
      </div>
      <OrgTree />
    </DashboardShell>
  );
}
