'use client';

import { BookOpen, Target, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { fetchInstructorDashboard } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { InstructorDashboardSkeleton } from '@/components/instructor/instructor-dashboard-skeleton';
import { InstructorCourseGrid } from '@/components/instructor/instructor-course-grid';
import { AtRiskStudentsCard } from '@/components/instructor/at-risk-students-card';
import { CourseComparisonChart } from '@/components/instructor/course-comparison-chart';
import { CourseInsightCard } from '@/components/instructor/course-insight-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorDashboardPage() {
  return (
    <ProtectedRoute>
      <InstructorDashboardContent />
    </ProtectedRoute>
  );
}

// Weighted by studentCount — a plain mean of per-course percentages would
// let a 1-student course count as much as a 60-student one.
function overallAchievementPercent(courses: InstructorCourseSummary[]): number | null {
  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
  if (totalStudents === 0) return null;
  const achieved = courses.reduce(
    (sum, c) => sum + (c.achievementPercent * c.studentCount) / 100,
    0,
  );
  return (achieved / totalStudents) * 100;
}

function InstructorDashboardContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');

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
  const enrollments = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const achievement = overallAchievementPercent(courses);

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard icon={BookOpen} label="รายวิชาที่สอน" value={courses.length} suffix="วิชา" />
              <StatCard
                icon={Users}
                label="นักศึกษา (นับตามรายวิชา)"
                value={enrollments}
                suffix="คน"
              />
              <StatCard
                icon={Target}
                label="ผลสัมฤทธิ์เฉลี่ย (เกรด B ขึ้นไป)"
                value={achievement === null ? '—' : `${Math.round(achievement)}%`}
              />
            </div>
            <CourseInsightCard courses={courses} />
            <AtRiskStudentsCard courses={courses} />
            {courses.length >= 2 && <CourseComparisonChart courses={courses} />}
            <InstructorCourseGrid courses={courses} />
          </>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
