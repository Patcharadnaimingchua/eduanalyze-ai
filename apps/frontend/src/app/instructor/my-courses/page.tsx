'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInstructorDashboard } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { InstructorDashboardSkeleton } from '@/components/instructor/instructor-dashboard-skeleton';
import { InstructorCourseGrid } from '@/components/instructor/instructor-course-grid';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');

  // Same query key as /instructor/dashboard — React Query serves this from
  // cache with zero extra network round trips when navigating between the
  // two pages, so there's no need for a shared fetch hook to avoid refetching.
  const dashboardQuery = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: fetchInstructorDashboard,
    enabled: isInstructor,
  });

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

  const courses = dashboardQuery.data?.courses ?? [];

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <div>
          <h1 className="text-2xl font-semibold text-primary">รายวิชาที่สอน</h1>
          <p className="text-sm text-muted-foreground">
            รายวิชาทั้งหมดที่คุณได้รับมอบหมายให้สอนในภาคการศึกษานี้
          </p>
        </div>

        {dashboardQuery.isLoading && <InstructorDashboardSkeleton />}

        {dashboardQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              ไม่สามารถโหลดข้อมูลรายวิชาได้ กรุณาลองใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        )}

        {dashboardQuery.data && courses.length === 0 && (
          <Alert>
            <AlertDescription>ยังไม่มีวิชาที่ได้รับมอบหมายให้คุณสอน</AlertDescription>
          </Alert>
        )}

        {dashboardQuery.data && courses.length > 0 && (
          <InstructorCourseGrid courses={courses} />
        )}
      </DashboardShell>
    </RequireRole>
  );
}
