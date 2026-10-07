'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchInstructorDashboard, fetchInstructorStudents, fetchInstructorYearLevels } from '@/lib/api/instructor';
import { buildCourseOverviews, buildCourseYearMatrix } from '@/lib/instructor-overview';
import { buildYearLevelsSummary, worstRiskById } from '@/lib/student-directory';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { YearLevelMatrix } from '@/components/instructor/year-level-matrix';
import { InstructorYearLevelOverview } from '@/components/instructor/instructor-year-level-overview';
import { PageHeader } from '@/components/layout/page-header';
import { Reveal } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';
import { PageSection } from '@/components/layout/page-section';

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

  // Same key as the dashboard: the per-course grade tally and the goal of each course.
  const dashboardQuery = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: fetchInstructorDashboard,
    enabled: isInstructor,
  });
  // Credits only weight the overall grade average, which this page does not show,
  // so it is not requested here.
  const courses = useMemo(() => dashboardQuery.data?.courses ?? [], [dashboardQuery.data]);

  const buckets = useMemo(() => query.data?.buckets ?? [], [query.data]);
  const riskById = useMemo(
    () => (studentsQuery.data ? worstRiskById(studentsQuery.data.students) : null),
    [studentsQuery.data],
  );
  const matrix = useMemo(() => {
    if (!studentsQuery.data || !query.data || courses.length === 0) return null;
    const levelByStudent = new Map<string, number>();
    for (const b of query.data.buckets) for (const st of b.students) levelByStudent.set(st.studentProfileId, b.yearLevel);
    return buildCourseYearMatrix(buildCourseOverviews(courses), studentsQuery.data.students, levelByStudent);
  }, [studentsQuery.data, query.data, courses]);
  const totalStudents = buckets.reduce((sum, b) => sum + b.students.length, 0);
  // Wait for the risk data (or its failure) so the badges and the header line
  // do not pop in a moment after the cards.
  const ready =
    !!query.data &&
    (studentsQuery.isSuccess || studentsQuery.isError) &&
    (dashboardQuery.isSuccess || dashboardQuery.isError);
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

        {ready && totalStudents > 0 && matrix && matrix.levels.length > 0 && (
          <Reveal index={1}>
            <PageSection
              title="เกรดกลาง แยกตามวิชาและชั้นปี"
              description="นับเป็นที่นั่ง (คนที่เรียนหลายวิชาจะนับในแต่ละวิชา) ช่อง – คือวิชานั้นไม่มีนักศึกษาในชั้นปีนั้น ช่องที่มีนักศึกษาที่ได้เกรดไม่ถึง 5 ที่นั่งไม่แสดงค่ากลาง เรียงตามรหัสวิชา กดที่วิชาเพื่อดูรายละเอียด"
            >
              <YearLevelMatrix matrix={matrix} />
              {matrix.unplaced > 0 && (
                <p className="text-xs text-muted-foreground">
                  {matrix.unplaced} ที่นั่งหาชั้นปีไม่พบ จึงไม่อยู่ในตารางนี้
                </p>
              )}
            </PageSection>
          </Reveal>
        )}

        {ready && totalStudents > 0 && (
          <CollapsibleSection
            framed={false}
            title="รายชื่อนักศึกษาแต่ละชั้นปี"
            meta={<span className="text-sm font-normal text-muted-foreground">กดชั้นปีเพื่อดูรายชื่อ</span>}
          >
            <InstructorYearLevelOverview buckets={buckets} riskById={riskById} />
          </CollapsibleSection>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
