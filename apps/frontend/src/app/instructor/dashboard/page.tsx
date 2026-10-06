'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchInstructorCourseTimeline,
  fetchInstructorDashboard,
  fetchInstructorStudents,
  fetchInstructorYearLevels,
} from '@/lib/api/instructor';
import { fetchCourses } from '@/lib/api/academic-record';
import { useAuth } from '@/lib/auth-context';
import { splitTimeline, termLabel } from '@/lib/course-timeline-summary';
import { describeHeadcount } from '@/lib/headcount';
import {
  ALL_GRADES,
  GRADE_POINTS,
  breakdownByYearLevel,
  buildCourseOverviews,
  buildOverallOverview,
  buildOverviewSentence,
  selectGoals,
  sortByGap,
  statusOf,
} from '@/lib/instructor-overview';
import { computeAchievementChange } from '@/lib/instructor-summary';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { AchievementChangeBadge } from '@/components/instructor/achievement-change-badge';
import { CourseOverviewList } from '@/components/instructor/course-overview-list';
import { DashboardKpis } from '@/components/instructor/dashboard-kpis';
import { GoalsCard } from '@/components/instructor/goals-card';
import { GradeBand } from '@/components/instructor/grade-band';
import { InstructorDashboardSkeleton } from '@/components/instructor/instructor-dashboard-skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { Reveal } from '@/components/layout/reveal';
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorDashboardPage() {
  return (
    <ProtectedRoute>
      <InstructorDashboardContent />
    </ProtectedRoute>
  );
}

function InstructorDashboardContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');

  const dashboardQuery = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: fetchInstructorDashboard,
    enabled: isInstructor,
  });
  const courses = useMemo(() => dashboardQuery.data?.courses ?? [], [dashboardQuery.data]);
  const courseKey = courses.map((c) => c.courseId).join(',');

  // Same keys as the students, year-levels and my-courses pages, so each is one
  // cached request shared across them. None of the three is needed for the main
  // numbers: without them the page shows seats, no year split and no term label.
  const studentsQuery = useQuery({
    queryKey: ['instructor-students'],
    queryFn: () => fetchInstructorStudents({}),
    enabled: isInstructor,
  });
  const yearLevelsQuery = useQuery({
    queryKey: ['instructor-year-levels'],
    queryFn: fetchInstructorYearLevels,
    enabled: isInstructor,
  });
  const timelineQuery = useQuery({
    queryKey: ['instructor-course-timeline'],
    queryFn: fetchInstructorCourseTimeline,
    enabled: isInstructor,
  });
  // GET /courses lists every course in the system. Same key and function as the
  // course page's info section (the cache is shared and left as it is); `select`
  // keeps only this instructor's own courses' credits and the rest is dropped
  // here, never stored in this page.
  const creditsQuery = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: isInstructor && courseKey !== '',
    select: useCallback(
      (all: Awaited<ReturnType<typeof fetchCourses>>) => {
        const mine = new Set(courseKey.split(','));
        return new Map(all.filter((c) => mine.has(c.id)).map((c) => [c.id, c.credits]));
      },
      [courseKey],
    ),
  });
  const credits = creditsQuery.data;

  const overviews = useMemo(() => buildCourseOverviews(courses, credits), [courses, credits]);
  const sorted = useMemo(() => sortByGap(overviews), [overviews]);
  const overall = useMemo(() => buildOverallOverview(overviews, credits), [overviews, credits]);
  const goals = useMemo(() => selectGoals(overviews, 5), [overviews]);

  const yearLevelByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const bucket of yearLevelsQuery.data?.buckets ?? []) {
      for (const s of bucket.students) map.set(s.studentProfileId, bucket.yearLevel);
    }
    return map;
  }, [yearLevelsQuery.data]);
  const yearCells = useMemo(
    () =>
      studentsQuery.data && yearLevelsQuery.data
        ? breakdownByYearLevel(studentsQuery.data.students, yearLevelByStudent, credits).overall
        : null,
    [studentsQuery.data, yearLevelsQuery.data, yearLevelByStudent, credits],
  );

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

  // People, not seats: the students endpoint lists every (student, course) row.
  const people = studentsQuery.data
    ? new Set(studentsQuery.data.students.map((s) => s.studentProfileId)).size
    : null;
  const seats = overall.stats.seats;
  const headcount = describeHeadcount(people, seats);
  const change = computeAchievementChange(courses);
  const sentence = dashboardQuery.data ? buildOverviewSentence(overall, overviews) : null;
  const latest = timelineQuery.data ? splitTimeline(timelineQuery.data.years).latest : null;

  const hasPointSeats = ALL_GRADES.some((g) => GRADE_POINTS[g] !== null && overall.stats.counts[g] > 0);
  const gpaNote =
    overall.stats.gpa !== null
      ? null
      : !hasPointSeats
        ? 'ยังไม่มีเกรดที่นำมาคิด'
        : creditsQuery.isLoading
          ? 'กำลังโหลดหน่วยกิตของวิชา'
          : 'ยังแสดงไม่ได้ เพราะโหลดหน่วยกิตของวิชาไม่ได้ จึงถ่วงหน่วยกิตไม่ได้';

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <Reveal index={0}>
          <PageHeader
            title="แดชบอร์ดอาจารย์"
            description={sentence ?? 'ภาพรวมผลการเรียนและเป้าการเรียนรู้ของรายวิชาที่คุณสอน'}
            actions={
              latest && (
                <Badge tone="neutral" className="px-3 py-1 text-sm">
                  เทอมล่าสุด {termLabel(latest)}
                </Badge>
              )
            }
          />
        </Reveal>

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
            <Reveal index={1}>
              <div className="space-y-2">
                <DashboardKpis
                  overall={overall}
                  gpaNote={gpaNote}
                  headcount={headcount}
                  trend={change && <AchievementChangeBadge change={change} />}
                />
                <p className="text-xs text-muted-foreground">
                  ตัวเลขรวมผลล่าสุดของนักศึกษาแต่ละคนจากทุกเทอม
                </p>
              </div>
            </Reveal>

            <Reveal index={2}>
              <CourseOverviewList
                overviews={sorted}
                yearCells={yearCells}
                overallTarget={overall.target}
                overallStatusOf={(p) => statusOf(p, overall.target)}
              />
            </Reveal>

            <RevealOnScroll>
              <GoalsCard rows={goals.rows} unmet={goals.unmet} total={goals.total} />
            </RevealOnScroll>

            <RevealOnScroll>
              <GradeBand counts={overall.stats.counts} />
            </RevealOnScroll>
          </>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
