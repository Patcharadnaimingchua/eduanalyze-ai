'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInstructorCourseTimeline } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { InstructorCourseTimelineSkeleton } from '@/components/instructor/instructor-dashboard-skeleton';
import { InstructorCourseTimeline } from '@/components/instructor/instructor-course-timeline';
import { PageHeader } from '@/components/layout/page-header';
import { Reveal } from '@/components/layout/reveal';
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

  // Own query key/endpoint — this view only needs enrollment + year-level
  // data, not the CLO/PLO/Course-Assessment payload /instructor/dashboard
  // carries, so it doesn't share instructor-dashboard's cache entry.
  const timelineQuery = useQuery({
    queryKey: ['instructor-course-timeline'],
    queryFn: fetchInstructorCourseTimeline,
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

  const years = timelineQuery.data?.years ?? [];

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <Reveal index={0}>
          <PageHeader
            title="รายวิชาที่สอน"
            description="รายวิชาที่คุณได้รับมอบหมายให้สอน จัดกลุ่มตามปีการศึกษาและภาคการศึกษา"
          />
        </Reveal>

        {timelineQuery.isLoading && <InstructorCourseTimelineSkeleton />}

        {timelineQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              ไม่สามารถโหลดข้อมูลรายวิชาได้ กรุณาลองใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        )}

        {timelineQuery.data && years.length === 0 && (
          <Alert>
            <AlertDescription>ยังไม่มีวิชาที่ได้รับมอบหมายให้คุณสอน</AlertDescription>
          </Alert>
        )}

        {timelineQuery.data && years.length > 0 && (
          <>
            <Reveal index={1}>
              <Alert>
                <AlertDescription>
                  รายการภาคการศึกษาด้านล่างแสดงตามประวัติการลงทะเบียนเรียนจริงของนักศึกษาในแต่ละวิชา
                  หากคุณเพิ่งได้รับมอบหมายให้สอนวิชาใดวิชาหนึ่ง
                  ระบบอาจแสดงภาคการศึกษาย้อนหลังที่คุณไม่ได้เป็นผู้สอนด้วย
                  เนื่องจากระบบยังไม่ได้บันทึกว่าอาจารย์แต่ละท่านสอนวิชานั้นในภาคใดบ้าง
                </AlertDescription>
              </Alert>
            </Reveal>

            <Reveal index={2}>
              <InstructorCourseTimeline years={years} />
            </Reveal>
          </>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
