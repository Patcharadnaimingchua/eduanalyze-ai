'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchInstructorStudents, fetchInstructorYearLevels } from '@/lib/api/instructor';
import { buildYearLevelsSummary, worstRiskById } from '@/lib/student-directory';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { InstructorYearLevelOverview } from '@/components/instructor/instructor-year-level-overview';
import { PageHeader } from '@/components/layout/page-header';
import { Reveal } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
  // Same key as the students page, so the two share one cache entry. Year
  // levels carry no risk of their own; this supplies it per student.
  const studentsQuery = useQuery({
    queryKey: ['instructor-students'],
    queryFn: () => fetchInstructorStudents({}),
    enabled: isInstructor,
  });

  const buckets = useMemo(() => query.data?.buckets ?? [], [query.data]);
  const riskById = useMemo(
    () => (studentsQuery.data ? worstRiskById(studentsQuery.data.students) : null),
    [studentsQuery.data],
  );
  const totalStudents = buckets.reduce((sum, b) => sum + b.students.length, 0);
  // Wait for the risk data (or its failure) so the badges and the header line
  // do not pop in a moment after the cards.
  const ready = !!query.data && (studentsQuery.isSuccess || studentsQuery.isError);
  const summary = ready ? buildYearLevelsSummary(buckets, riskById) : null;

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
        <Reveal index={0}>
          <PageHeader
            title="ภาพรวมชั้นปี"
            description={
              summary ?? 'นักศึกษาที่เคยเรียนวิชาของคุณ แบ่งตามชั้นปี (ไม่รวมนักศึกษาทั้งหลักสูตร)'
            }
          />
        </Reveal>

        {(query.isLoading || (!!query.data && !ready)) && (
          <StatCardsSkeleton count={4} className="md:grid-cols-2 xl:grid-cols-4" />
        )}

        {query.isError && (
          <Alert variant="destructive">
            <AlertDescription>ไม่สามารถโหลดข้อมูลภาพรวมชั้นปีได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
          </Alert>
        )}

        {ready && totalStudents === 0 && (
          <Reveal index={1}>
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  illustration="no-students"
                  description="ยังไม่มีนักศึกษาที่เกี่ยวข้องกับวิชาที่คุณสอน ชั้นปีจะขึ้นที่นี่เมื่อมีนักศึกษาลงเรียน"
                  action={
                    <Button asChild variant="outline" className="h-11">
                      <Link href="/instructor/my-courses">ดูรายวิชาที่สอน</Link>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </Reveal>
        )}

        {ready && totalStudents > 0 && (
          <InstructorYearLevelOverview buckets={buckets} riskById={riskById} />
        )}
      </DashboardShell>
    </RequireRole>
  );
}
