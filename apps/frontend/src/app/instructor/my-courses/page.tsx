'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorMyCoursesPage() {
  return (
    <ProtectedRoute>
      <InstructorMyCoursesContent />
    </ProtectedRoute>
  );
}

function InstructorMyCoursesContent() {
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
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <div>
          <h1 className="text-2xl font-semibold text-primary">รายวิชาที่สอน</h1>
          <p className="text-sm text-muted-foreground">กำลังพัฒนา</p>
        </div>
      </DashboardShell>
    </RequireRole>
  );
}
