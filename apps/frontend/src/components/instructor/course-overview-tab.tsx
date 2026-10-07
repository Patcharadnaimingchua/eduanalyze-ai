'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { fetchInstructorStudents, fetchInstructorYearLevels } from '@/lib/api/instructor';
import { yearLevelLabel } from '@/lib/course-timeline-summary';
import { formatPercent } from '@/lib/format-percent';
import { formatSemesterLabel } from '@/lib/grade-label';
import {
  breakdownByYearLevel,
  buildCourseOverviews,
  formatGpa,
  statusOf,
} from '@/lib/instructor-overview';
import { PageSection } from '@/components/layout/page-section';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GradeBand } from './grade-band';
import { GoalBar, LowSampleTag, StatusBadge } from './overview-parts';
import { SemesterTrendChart } from './semester-trend-chart';

// A trend over fewer terms than this is two dots and a line: not a trend.
const MIN_TERMS_FOR_TREND = 3;

// The numbers behind one course: how many reached B or above against the goal,
// the grade average, how it splits by year level, the grade bar and, with
// enough terms, the trend. Everything comes from the dashboard response already
// loaded plus the students and year-levels reports the other pages share.
export function CourseOverviewTab({ course }: Readonly<{ course: InstructorCourseSummary }>) {
  const overview = useMemo(() => buildCourseOverviews([course])[0], [course]);
  const { stats, target, status } = overview;

  const studentsQuery = useQuery({
    queryKey: ['instructor-students'],
    queryFn: () => fetchInstructorStudents({}),
  });
  const yearLevelsQuery = useQuery({
    queryKey: ['instructor-year-levels'],
    queryFn: fetchInstructorYearLevels,
  });

  const yearCells = useMemo(() => {
    if (!studentsQuery.data || !yearLevelsQuery.data) return null;
    const levelByStudent = new Map<string, number>();
    for (const bucket of yearLevelsQuery.data.buckets) {
      for (const s of bucket.students) levelByStudent.set(s.studentProfileId, bucket.yearLevel);
    }
    const rows = studentsQuery.data.students.filter((s) => s.courseId === course.courseId);
    return breakdownByYearLevel(rows, levelByStudent).byCourse.get(course.courseId) ?? [];
  }, [studentsQuery.data, yearLevelsQuery.data, course.courseId]);

  const trend = course.semesterTrend;
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-t-4 border-t-brand">
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm font-medium text-muted-foreground">ได้ B ขึ้นไป (เทียบเป้า)</p>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-5xl font-semibold leading-none tabular-nums text-primary">
                {formatPercent(stats.achievedPercent)}
              </span>
              <span className="text-sm text-muted-foreground">
                {target === null ? 'ยังไม่มีเป้า' : `เป้า ${formatPercent(target)}`}
              </span>
            </p>
            <GoalBar percent={stats.achievedPercent} target={target} status={status} />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              {stats.lowSample && stats.graded > 0 && <LowSampleTag counted={stats.graded} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm font-medium text-muted-foreground">เกรดเฉลี่ย</p>
            <p className="text-3xl font-semibold tabular-nums text-primary">{formatGpa(stats.gpa)}</p>
            <p className="text-xs text-muted-foreground">
              {stats.gpa === null ? 'ยังไม่มีเกรดที่นำมาคิด' : 'จาก 4.00 ไม่รวม W, I, S, U'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm font-medium text-muted-foreground">นักศึกษา</p>
            <p className="text-3xl font-semibold tabular-nums text-primary">
              {stats.seats}
              <span className="ml-1 text-base font-normal text-muted-foreground">คน</span>
            </p>
            <p className="text-xs text-muted-foreground">
              ได้ F {stats.f} คน · ถอน (W) {stats.w} คน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm font-medium text-muted-foreground">เทียบเทอมก่อน</p>
            {previous ? (
              <>
                <p className="text-3xl font-semibold tabular-nums text-primary">
                  {formatPercent(previous.achievementPercent)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSemesterLabel(previous.semesterTerm, previous.academicYear)} · {previous.studentCount} คน
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-semibold text-primary">–</p>
                <p className="text-xs text-muted-foreground">ยังไม่มีเทอมก่อนให้เทียบ</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <YearLevelTable
        cells={yearCells}
        loading={studentsQuery.isLoading || yearLevelsQuery.isLoading}
        target={target}
      />

      <GradeBand counts={stats.counts} description="ผลล่าสุดของนักศึกษาแต่ละคนในวิชานี้" />

      <PageSection title="แนวโน้มรายเทอม">
        {trend.length >= MIN_TERMS_FOR_TREND ? (
          <SemesterTrendChart trend={trend} />
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
            ข้อมูลน้อย ยังไม่ควรสรุปแนวโน้ม (มี {trend.length} เทอม ต้องมีอย่างน้อย {MIN_TERMS_FOR_TREND} เทอม)
          </p>
        )}
      </PageSection>
    </div>
  );
}

function YearLevelTable({
  cells,
  loading,
  target,
}: Readonly<{
  cells: ReturnType<typeof breakdownByYearLevel>['overall'] | null;
  loading: boolean;
  target: number | null;
}>) {
  return (
    <PageSection
      title="แยกตามชั้นปี"
      description="ชั้นปีของนักศึกษาเมื่อเทียบกับปีการศึกษาล่าสุด แสดงเฉพาะชั้นปีที่มีนักศึกษาในวิชานี้"
    >
      {loading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : cells === null ? (
        <p className="text-sm text-muted-foreground">ยังโหลดข้อมูลชั้นปีไม่ได้ จึงยังแยกตามชั้นปีไม่ได้</p>
      ) : cells.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลชั้นปีของนักศึกษาในวิชานี้</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">ชั้นปี</th>
                  <th className="w-[38%] px-4 py-2 font-medium">ได้ B ขึ้นไป (เส้นดำคือเป้า)</th>
                  <th className="px-4 py-2 font-medium">เกรดเฉลี่ย</th>
                  <th className="px-4 py-2 font-medium">นักศึกษา</th>
                  <th className="px-4 py-2 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((c) => {
                  const st = statusOf(c.stats.achievedPercent, target);
                  return (
                    <tr key={c.yearLevel} className="border-b last:border-0">
                      <td className="px-4 py-3 font-semibold text-primary">{yearLevelLabel(c.yearLevel)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <GoalBar className="flex-1" percent={c.stats.achievedPercent} target={target} status={st} />
                          <span className="w-12 shrink-0 text-right text-base font-semibold tabular-nums text-primary">
                            {formatPercent(c.stats.achievedPercent)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatGpa(c.stats.gpa)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          {c.stats.seats} คน
                          {c.stats.lowSample && c.stats.graded > 0 && <LowSampleTag counted={c.stats.graded} />}
                        </span>
                        {(c.stats.f > 0 || c.stats.w > 0) && (
                          <span className="block text-xs">
                            {c.stats.f > 0 && `F ${c.stats.f}`}
                            {c.stats.f > 0 && c.stats.w > 0 && ' · '}
                            {c.stats.w > 0 && `W ${c.stats.w}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={st} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {cells.map((c) => {
              const st = statusOf(c.stats.achievedPercent, target);
              return (
                <li key={c.yearLevel} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-primary">{yearLevelLabel(c.yearLevel)}</p>
                    <StatusBadge status={st} className="shrink-0" />
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-3xl font-semibold leading-none tabular-nums text-primary">
                      {formatPercent(c.stats.achievedPercent)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ได้ B ขึ้นไป{target !== null && ` · เป้า ${formatPercent(target)}`}
                    </span>
                  </p>
                  <GoalBar percent={c.stats.achievedPercent} target={target} status={st} />
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>เกรดเฉลี่ย {formatGpa(c.stats.gpa)}</span>
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {c.stats.seats} คน
                      {c.stats.lowSample && c.stats.graded > 0 && <LowSampleTag counted={c.stats.graded} />}
                    </span>
                    {c.stats.f > 0 && <span>F {c.stats.f}</span>}
                    {c.stats.w > 0 && <span>W {c.stats.w}</span>}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageSection>
  );
}
