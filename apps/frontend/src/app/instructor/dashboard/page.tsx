'use client';

import { Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchInstructorDashboard } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { InstructorDashboardSkeleton } from '@/components/instructor/instructor-dashboard-skeleton';
import { InstructorCourseGrid } from '@/components/instructor/instructor-course-grid';
import {
  InstructorDetailPanel,
  type InstructorTab,
} from '@/components/instructor/instructor-detail-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstructorDashboardPage() {
  return (
    <ProtectedRoute>
      {/* useSearchParams requires a Suspense boundary in the App Router */}
      <Suspense fallback={<InstructorDashboardSkeleton />}>
        <InstructorDashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function InstructorDashboardContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dashboardQuery = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: fetchInstructorDashboard,
    enabled: isInstructor,
  });

  const courses = dashboardQuery.data?.courses ?? [];
  const courseIdParam = searchParams.get('courseId');
  const tabParam = searchParams.get('tab');

  const selectedCourseId =
    courseIdParam && courses.some((c) => c.courseId === courseIdParam)
      ? courseIdParam
      : (courses[0]?.courseId ?? null);
  const activeTab: InstructorTab =
    tabParam === 'clo' || tabParam === 'roster' || tabParam === 'evidence' ? tabParam : 'grades';

  // courseId/tab live only in the URL (no parallel useState) — once courses
  // load, reflect the resolved default back into the URL so a reload lands
  // on the same course/tab instead of silently re-defaulting.
  useEffect(() => {
    if (!selectedCourseId) return;
    if (courseIdParam === selectedCourseId && tabParam === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('courseId', selectedCourseId);
    params.set('tab', activeTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, activeTab, courseIdParam, tabParam]);

  function selectCourse(courseId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('courseId', courseId);
    params.set('tab', activeTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function selectTab(tab: InstructorTab) {
    if (!selectedCourseId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('courseId', selectedCourseId);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId) ?? null;

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <div>
          <h1 className="text-2xl font-semibold text-primary">แดชบอร์ดอาจารย์</h1>
          <p className="text-sm text-muted-foreground">
            ภาพรวมผลการเรียนและ CLO Achievement ของรายวิชาที่คุณสอน
          </p>
        </div>

        {dashboardQuery.isLoading && <InstructorDashboardSkeleton />}

        {dashboardQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        )}

        {dashboardQuery.data && courses.length === 0 && (
          <Alert>
            <AlertDescription>ยังไม่มีวิชาที่ได้รับมอบหมายให้คุณสอน</AlertDescription>
          </Alert>
        )}

        {dashboardQuery.data && courses.length > 0 && (
          <>
            <InstructorCourseGrid
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelect={selectCourse}
            />
            {selectedCourse && (
              <InstructorDetailPanel
                course={selectedCourse}
                activeTab={activeTab}
                onTabChange={selectTab}
                isInstructor={isInstructor}
              />
            )}
          </>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
