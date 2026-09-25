'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInstructorYearLevels } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { YearLevelOverview } from '@/components/dashboard/year-level-overview';
import { PageHeader } from '@/components/layout/page-header';
import { Reveal } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

export default function InstructorYearLevelsPage() {
  return (
    <ProtectedRoute>
      <InstructorYearLevelsContent />
    </ProtectedRoute>
  );
}

function InstructorYearLevelsContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');

  const query = useQuery({
    queryKey: ['instructor-year-levels'],
    queryFn: fetchInstructorYearLevels,
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

  const buckets = query.data?.buckets ?? [];
  const totalStudents = buckets.reduce((sum, b) => sum + b.students.length, 0);

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <Reveal index={0}>
          <PageHeader
            title="ภาพรวมชั้นปี"
            description="นักศึกษาที่เคยเรียนวิชาของคุณ แบ่งตามชั้นปี (ไม่รวมนักศึกษาทั้งหลักสูตร)"
          />
        </Reveal>

        {query.isLoading && <StatCardsSkeleton count={4} />}

        {query.isError && (
          <Alert variant="destructive">
            <AlertDescription>ไม่สามารถโหลดข้อมูลภาพรวมชั้นปีได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
          </Alert>
        )}

        {query.data && totalStudents === 0 && (
          <Alert>
            <AlertDescription>ยังไม่มีนักศึกษาที่เกี่ยวข้องกับวิชาที่คุณสอน</AlertDescription>
          </Alert>
        )}

        {query.data && totalStudents > 0 && <YearLevelOverview buckets={buckets} />}
      </DashboardShell>
    </RequireRole>
  );
}
