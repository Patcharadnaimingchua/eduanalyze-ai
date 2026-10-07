'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CircleDashed } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import {
  fetchInstructorCourseTimeline,
  fetchInstructorStudents,
  fetchInstructorYearLevels,
} from '@/lib/api/instructor';
import {
  DATA_SOURCE_NOTE,
  EMPTY_SNAPSHOT,
  SPARSE_GOAL,
  SPARSE_LABEL,
  SPARSE_SUMMARY,
  SPARSE_TREND,
  SPARSE_YEAR_NOTE,
  MIN_TERMS_FOR_TREND,
  buildCourseSnapshot,
  changeLine,
  courseTermInfo,
  gradedPeopleLine,
  summaryLine,
  type CourseSnapshot,
  type GoalItem,
  type SnapshotStatus,
  type YearRow,
} from '@/lib/course-snapshot';
import { yearLevelLabel } from '@/lib/course-timeline-summary';
import { formatPercent } from '@/lib/format-percent';
import { GRADE_LABELS } from '@/lib/grade-label';
import { formatGpa, type OverviewStatus } from '@/lib/instructor-overview';
import { BAR_TONE_CLASSES, type SemanticTone } from '@/lib/tone';
import { cn } from '@/lib/utils';
import { PageSection } from '@/components/layout/page-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalBar, LowSampleTag, StatusBadge } from './overview-parts';

const GRADE_TONE: Record<string, SemanticTone> = {
  A: 'success',
  B_PLUS: 'success',
  B: 'success',
  C_PLUS: 'warning',
  C: 'warning',
  D_PLUS: 'danger',
  D: 'danger',
  F: 'danger',
};

// Grey text, never a warning colour: too few people is not a problem to fix.
function SparseBadge({ children = SPARSE_LABEL }: Readonly<{ children?: ReactNode }>) {
  return (
    <Badge tone="neutral" className="gap-1 px-2.5 py-1 text-sm">
      <CircleDashed size={14} aria-hidden="true" />
      {children}
    </Badge>
  );
}

function StatusOf({ status }: Readonly<{ status: SnapshotStatus }>) {
  return status === 'sparse' ? <SparseBadge /> : <StatusBadge status={status} />;
}

const barStatus = (status: SnapshotStatus): OverviewStatus => (status === 'sparse' ? 'none' : status);

// One course, read the same way on the dashboard and on the course page. The
// numbers all come from buildCourseSnapshot, so the two pages cannot differ.
export function CourseOverview({
  course,
  selector,
  showHeading = true,
  showDetailLink = true,
}: Readonly<{
  course: InstructorCourseSummary;
  selector?: ReactNode;
  showHeading?: boolean;
  showDetailLink?: boolean;
}>) {
  // Same keys as the other instructor pages: one cached request each.
  const studentsQuery = useQuery({
    queryKey: ['instructor-students'],
    queryFn: () => fetchInstructorStudents({}),
  });
  const yearLevelsQuery = useQuery({
    queryKey: ['instructor-year-levels'],
    queryFn: fetchInstructorYearLevels,
  });
  const timelineQuery = useQuery({
    queryKey: ['instructor-course-timeline'],
    queryFn: fetchInstructorCourseTimeline,
  });

  const seatRows = useMemo(
    () => (studentsQuery.data?.students ?? []).filter((s) => s.courseId === course.courseId),
    [studentsQuery.data, course.courseId],
  );
  const yearLevelByStudent = useMemo(() => {
    if (!yearLevelsQuery.data || !studentsQuery.data) return null;
    const map = new Map<string, number>();
    for (const bucket of yearLevelsQuery.data.buckets) {
      for (const s of bucket.students) map.set(s.studentProfileId, bucket.yearLevel);
    }
    return map;
  }, [yearLevelsQuery.data, studentsQuery.data]);

  const snapshot = useMemo(
    () => buildCourseSnapshot({ course, seatRows, yearLevelByStudent }),
    [course, seatRows, yearLevelByStudent],
  );
  const termInfo = useMemo(
    () => (timelineQuery.data ? courseTermInfo(timelineQuery.data.years, course.courseId) : null),
    [timelineQuery.data, course.courseId],
  );
  const yearsLoading = studentsQuery.isLoading || yearLevelsQuery.isLoading;

  const base = `/instructor/courses/${course.courseId}`;
  const metaLine = [termInfo?.termLabel, termInfo?.curriculum].filter(Boolean).join(' · ');

  return (
    <div className="space-y-6">
      <section aria-label="วิชาที่เลือก" className="space-y-3">
        {selector}
        {showHeading && (
          <h2 className="break-words text-xl font-semibold text-primary">
            {course.code} {course.name}
          </h2>
        )}
        {metaLine && <p className="text-sm text-muted-foreground">{metaLine}</p>}
        {!snapshot.empty && (
          <p className="text-sm text-muted-foreground">
            {gradedPeopleLine(snapshot.stats)} · {DATA_SOURCE_NOTE}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-11">
            <Link href={`${base}?tab=evidence`}>กรอกคะแนน</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href={`${base}?tab=students`}>รายชื่อนักศึกษา ({snapshot.stats.seats})</Link>
          </Button>
          {showDetailLink && (
            <Button asChild variant="outline" className="h-11">
              <Link href={base}>รายละเอียดรายวิชา</Link>
            </Button>
          )}
        </div>
      </section>

      {snapshot.empty ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{EMPTY_SNAPSHOT}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SummarySection snapshot={snapshot} />
          <YearSection snapshot={snapshot} loading={yearsLoading} />
          <GoalsSection snapshot={snapshot} />
          <GradesSection snapshot={snapshot} />
          <TrendSection snapshot={snapshot} />
        </>
      )}
    </div>
  );
}

function SummarySection({ snapshot }: Readonly<{ snapshot: CourseSnapshot }>) {
  const { stats, target, level, status } = snapshot;
  return (
    <PageSection title="สรุปผล">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-3">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-5xl font-semibold leading-none tabular-nums text-primary">
                {formatPercent(stats.achievedPercent)}
              </span>
              <span className="text-sm text-muted-foreground">{summaryLine(snapshot)}</span>
            </p>
            {level !== 'insufficient' && (
              <GoalBar percent={stats.achievedPercent} target={target} status={barStatus(status)} />
            )}
            <div className="flex flex-wrap items-center gap-2">
              {level === 'insufficient' ? <SparseBadge>{SPARSE_SUMMARY}</SparseBadge> : <StatusOf status={status} />}
              {level === 'low' && <LowSampleTag counted={stats.counted} />}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <Figure label="เกรดเฉลี่ย" value={formatGpa(stats.gpa)} note={stats.gpa === null ? 'ยังไม่มีเกรดที่นำมาคิด' : 'จาก 4.00'} />
            <Figure label="นักศึกษาที่มีเกรด" value={`${stats.seats} คน`} />
            <Figure label="ได้ F" value={`${stats.f} คน`} />
            <Figure label="ถอน (W)" value={`${stats.w} คน`} />
          </dl>
        </CardContent>
      </Card>
    </PageSection>
  );
}

function Figure({ label, value, note }: Readonly<{ label: string; value: string; note?: string }>) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums text-primary">{value}</dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

function YearSection({ snapshot, loading }: Readonly<{ snapshot: CourseSnapshot; loading: boolean }>) {
  const { years, target } = snapshot;
  let body: ReactNode;
  if (loading) {
    body = <Skeleton className="h-28 w-full rounded-xl" />;
  } else if (years === null) {
    body = <p className="text-sm text-muted-foreground">ยังโหลดข้อมูลชั้นปีไม่ได้ จึงยังแยกตามชั้นปีไม่ได้</p>;
  } else if (years.rows.length === 0) {
    body = <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลชั้นปีของนักศึกษาในวิชานี้</p>;
  } else {
    body = (
      <>
        <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">ชั้นปี</th>
                <th className="px-4 py-2 font-medium">มีเกรด (คน)</th>
                <th className="px-4 py-2 font-medium">ได้ B ขึ้นไป{target !== null && ` (เป้า ${formatPercent(target)})`}</th>
                <th className="px-4 py-2 font-medium">เกรดเฉลี่ย</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {years.rows.map((row) => (
                <tr key={row.yearLevel} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold text-primary">{yearLevelLabel(row.yearLevel)}</td>
                  <td className="px-4 py-3 tabular-nums">{row.stats.seats}</td>
                  <td className="px-4 py-3 text-base font-semibold tabular-nums text-primary">
                    {row.showNumbers ? formatPercent(row.stats.achievedPercent) : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.showNumbers ? formatGpa(row.stats.gpa) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <StatusOf status={row.status} />
                      {row.level === 'low' && <LowSampleTag counted={row.stats.counted} />}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-slate-100 rounded-xl border bg-card md:hidden">
          {years.rows.map((row) => (
            <YearListItem key={row.yearLevel} row={row} />
          ))}
        </ul>
        {years.rows.some((r) => !r.showNumbers) && (
          <p className="text-xs text-muted-foreground">{SPARSE_YEAR_NOTE}</p>
        )}
        {years.unplaced > 0 && (
          <p className="text-xs text-muted-foreground">{years.unplaced} คนหาชั้นปีไม่พบ จึงไม่อยู่ในตารางนี้</p>
        )}
      </>
    );
  }
  return (
    <PageSection title="ภาพรวมตามชั้นปี" description="ชั้นปีของนักศึกษาเทียบกับปีการศึกษาล่าสุด แสดงเฉพาะชั้นปีที่มีนักศึกษาในวิชานี้">
      {body}
    </PageSection>
  );
}

function YearListItem({ row }: Readonly<{ row: YearRow }>) {
  return (
    <li className="space-y-1 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-primary">{yearLevelLabel(row.yearLevel)}</p>
        <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
          <StatusOf status={row.status} />
          {row.level === 'low' && <LowSampleTag counted={row.stats.counted} />}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {row.showNumbers
          ? `ได้ B ขึ้นไป ${formatPercent(row.stats.achievedPercent)} · เกรดเฉลี่ย ${formatGpa(row.stats.gpa)} · ${row.stats.seats} คน`
          : `มีเกรด ${row.stats.seats} คน · ตัวเลข —`}
      </p>
    </li>
  );
}

function GoalRow({ goal, sparse }: Readonly<{ goal: GoalItem; sparse: boolean }>) {
  const Icon = goal.state === 'met' ? CheckCircle2 : goal.state === 'unmet' ? AlertCircle : CircleDashed;
  const tone =
    goal.state === 'met' ? 'text-emerald-600' : goal.state === 'unmet' ? 'text-amber-600' : 'text-slate-400';
  const label = goal.state === 'met' ? 'ผ่านเป้า' : goal.state === 'unmet' ? 'ยังไม่ถึงเป้า' : null;
  return (
    <li className="flex gap-3 py-3">
      <Icon size={18} aria-hidden="true" className={cn('mt-0.5 shrink-0', tone)} />
      <div className="min-w-0 space-y-0.5">
        <p className="break-words text-sm text-primary">
          <span className="font-semibold">{goal.code}</span> {goal.description}
        </p>
        <p className="text-xs text-muted-foreground">{sparse ? SPARSE_GOAL : label}</p>
      </div>
    </li>
  );
}

function GoalsSection({ snapshot }: Readonly<{ snapshot: CourseSnapshot }>) {
  const { goals } = snapshot;
  return (
    <PageSection
      title="เป้าการเรียนรู้"
      description={
        goals.items.length === 0 || goals.sparse
          ? undefined
          : `${goals.met} ผ่านเป้า / ${goals.unmet} ยังไม่ถึงเป้า`
      }
    >
      {goals.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีเป้าการเรียนรู้ที่กำหนดไว้ในวิชานี้</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border bg-card px-4">
          {goals.items.map((goal) => (
            <GoalRow key={goal.cloId} goal={goal} sparse={goals.sparse} />
          ))}
        </ul>
      )}
    </PageSection>
  );
}

function GradesSection({ snapshot }: Readonly<{ snapshot: CourseSnapshot }>) {
  const { grades } = snapshot;
  if (grades.scored === 0) {
    return (
      <PageSection title="การกระจายเกรด">
        <p className="text-sm text-muted-foreground">ยังไม่มีเกรด A ถึง F</p>
      </PageSection>
    );
  }
  return (
    <PageSection title="การกระจายเกรด" description="เกรดล่าสุดของนักศึกษาแต่ละคนในวิชานี้ (A ถึง F)">
      <div className="space-y-3">
        <div
          role="img"
          aria-label={grades.segments.map((s) => `${GRADE_LABELS[s.grade]} ${s.count} คน`).join(' · ')}
          className="flex h-8 overflow-hidden rounded-lg bg-slate-100"
        >
          {grades.segments
            .filter((s) => s.count > 0)
            .map((s) => (
              <span
                key={s.grade}
                className={cn('border-r border-background last:border-r-0', BAR_TONE_CLASSES[GRADE_TONE[s.grade]])}
                style={{ width: `${s.percent}%` }}
              />
            ))}
        </div>
        <dl className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-8">
          {grades.segments.map((s) => (
            <div key={s.grade} className="flex items-start gap-1.5">
              <span
                aria-hidden="true"
                className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm', BAR_TONE_CLASSES[GRADE_TONE[s.grade]])}
              />
              <div>
                <dt className="text-xs text-muted-foreground">{GRADE_LABELS[s.grade]}</dt>
                <dd className="text-sm font-semibold tabular-nums text-primary">{s.count}</dd>
                <dd className="text-xs tabular-nums text-muted-foreground">{formatPercent(s.percent)}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          ได้ F <span className="font-semibold text-primary">{grades.f}</span> คน · ถอน (W){' '}
          <span className="font-semibold text-primary">{grades.w}</span> คน · ยังไม่สมบูรณ์ (I){' '}
          <span className="font-semibold text-primary">{grades.incomplete}</span> คน
          {grades.notGraded > 0 && (
            <>
              {' '}
              · ไม่คิดเกรด (S, U) <span className="font-semibold text-primary">{grades.notGraded}</span> คน
            </>
          )}
        </p>
      </div>
    </PageSection>
  );
}

function TrendSection({ snapshot }: Readonly<{ snapshot: CourseSnapshot }>) {
  const { trend } = snapshot;
  return (
    <PageSection
      title="แนวโน้มรายภาคเรียน"
      description={trend.enough && trend.change ? changeLine(trend.change) : undefined}
    >
      {trend.enough ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trend.terms.map((term) => (
            <li key={term.key} className="space-y-1 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">{term.label}</p>
                {term.isLatest && <Badge tone="neutral">ภาคล่าสุด</Badge>}
              </div>
              {term.showNumbers ? (
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-3xl font-semibold leading-none tabular-nums text-primary">
                    {formatPercent(term.percent)}
                  </span>
                  <span className="text-sm text-muted-foreground">ได้ B ขึ้นไป</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{SPARSE_LABEL} · ตัวเลข —</p>
              )}
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                มีเกรด {term.students} คน
                {term.level === 'low' && <LowSampleTag counted={term.students} />}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {SPARSE_TREND} (มี {trend.termCount} ภาคเรียน ต้องมีอย่างน้อย {MIN_TERMS_FOR_TREND} ภาคเรียน)
        </p>
      )}
    </PageSection>
  );
}
