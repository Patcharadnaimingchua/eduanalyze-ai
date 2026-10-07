'use client';

import { useId, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ChevronDown, CircleDashed, Info } from 'lucide-react';
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
  formatPointsChange,
  excludedNote,
  gradedPeopleParts,
  summaryLine,
  type CourseSnapshot,
  type GoalItem,
  type YearRow,
} from '@/lib/course-snapshot';
import { yearLevelLabel } from '@/lib/course-timeline-summary';
import { formatPercent } from '@/lib/format-percent';
import {
  formatCourseGpa,
  formatGradeList,
  formatGradeTally,
  formatMedian,
  gradeText,
  summarizeGradeCenter,
} from '@/lib/grade-center';
import { showAchievementRing } from '@/lib/progress-ring-geometry';
import { GRADE_LABELS } from '@/lib/grade-label';
import { buildCourseOverviews, formatGpa } from '@/lib/instructor-overview';
import { cn } from '@/lib/utils';
import { PageSection } from '@/components/layout/page-section';
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedRing } from '@/components/ui/animated-ring';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LowSampleTag } from './overview-parts';

// Blue for B or above, grey for C, amber for D, red for F. Fixed colours rather
// than theme classes, so the label inside each segment keeps its contrast in
// both themes. Each segment is also named in words in the bar and below it, so
// colour is never the only signal.
const GRADE_BAR: Record<string, { fill: string; text: string }> = {
  A: { fill: '#1e3a8a', text: '#ffffff' },
  B_PLUS: { fill: '#1d4ed8', text: '#ffffff' },
  B: { fill: '#60a5fa', text: '#0f172a' },
  C_PLUS: { fill: '#64748b', text: '#ffffff' },
  C: { fill: '#cbd5e1', text: '#0f172a' },
  D_PLUS: { fill: '#f59e0b', text: '#1c1917' },
  D: { fill: '#fcd34d', text: '#1c1917' },
  F: { fill: '#dc2626', text: '#ffffff' },
};

const oneDecimal = (n: number) => `${n.toFixed(1)}%`;

// Grey text, never a warning colour: too few people is not a problem to fix.
function SparseBadge({ children = SPARSE_LABEL }: Readonly<{ children?: ReactNode }>) {
  return (
    <Badge tone="neutral" className="gap-1 px-2.5 py-1 text-sm">
      <CircleDashed size={14} aria-hidden="true" />
      {children}
    </Badge>
  );
}

// The three shortcuts of one course. On the dashboard they sit in the page
// header; on the course page they sit at the top of the overview.
export function CourseQuickActions({
  course,
  showDetailLink = true,
}: Readonly<{ course: InstructorCourseSummary; showDetailLink?: boolean }>) {
  const base = `/instructor/courses/${course.courseId}`;
  const seats = buildCourseOverviews([course])[0].stats.seats;
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" className="h-11">
        <Link href={`${base}?tab=evidence`}>กรอกคะแนน</Link>
      </Button>
      <Button asChild variant="outline" className="h-11">
        <Link href={`${base}?tab=students`}>รายชื่อนักศึกษา ({seats})</Link>
      </Button>
      {showDetailLink && (
        <Button asChild variant="outline" className="h-11">
          <Link href={base}>รายละเอียดรายวิชา</Link>
        </Button>
      )}
    </div>
  );
}

// A titled card: heading and a short line on the left, a reference on the right.
function SectionCard({
  title,
  description,
  aside,
  footer,
  children,
}: Readonly<{
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}>) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="rounded-xl border bg-card">
      <div className="flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold text-primary">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {aside && <div className="shrink-0 text-xs text-muted-foreground">{aside}</div>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
      {footer && (
        <div className="flex items-start gap-2 rounded-b-xl border-t bg-slate-50 px-5 py-3 text-xs text-muted-foreground">
          <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div className="space-y-1">{footer}</div>
        </div>
      )}
    </section>
  );
}

// One course, read the same way on the dashboard and on the course page. The
// numbers all come from buildCourseSnapshot, so the two pages cannot differ.
export function CourseOverview({
  course,
  selector,
  showHeading = true,
  showActions = true,
  showDetailLink = true,
}: Readonly<{
  course: InstructorCourseSummary;
  selector?: ReactNode;
  showHeading?: boolean;
  showActions?: boolean;
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
  const { people, excluded } = gradedPeopleParts(snapshot.stats);
  const note = excludedNote(excluded);

  return (
    <div className="space-y-6">
      <section aria-label="วิชาที่เลือก" className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            {selector}
            {showHeading && (
              <h2 className="break-words text-xl font-semibold text-primary">
                {course.code} {course.name}
              </h2>
            )}
            {termInfo?.termLabel && (
              <p className="text-sm text-muted-foreground">{termInfo.termLabel}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start lg:max-w-sm lg:flex-col lg:items-end">
            {termInfo?.curriculum && (
              <span className="inline-flex items-center rounded-md border border-brand bg-brand-light px-3 py-1.5 text-xs font-medium text-brand">
                {termInfo.curriculum}
              </span>
            )}
            {!snapshot.empty && (
              <div className="space-y-2 lg:text-right">
                <p className="flex items-center gap-2 text-xs text-muted-foreground lg:justify-end">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
                  {DATA_SOURCE_NOTE}
                </p>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    จากนักศึกษาที่มีเกรด{' '}
                    <span className="text-xl font-semibold tabular-nums text-primary">
                      {people}
                    </span>{' '}
                    คน
                  </p>
                  {note && <p className="text-xs text-muted-foreground">({note})</p>}
                </div>
              </div>
            )}
          </div>
        </div>
        {showActions && (
          <div className="mt-4">
            <CourseQuickActions course={course} showDetailLink={showDetailLink} />
          </div>
        )}
      </section>

      {snapshot.empty ? (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">{EMPTY_SNAPSHOT}</p>
        </section>
      ) : (
        <>
          <SummarySection snapshot={snapshot} termLabel={termInfo?.termLabel} />
          <YearSection snapshot={snapshot} loading={yearsLoading} />
          <RevealOnScroll>
            <GoalsSection snapshot={snapshot} />
          </RevealOnScroll>
          <RevealOnScroll>
            <GradesSection snapshot={snapshot} />
          </RevealOnScroll>
          <RevealOnScroll>
            <TrendSection snapshot={snapshot} />
          </RevealOnScroll>
        </>
      )}
    </div>
  );
}

function SummarySection({
  snapshot,
  termLabel,
}: Readonly<{ snapshot: CourseSnapshot; termLabel?: string }>) {
  const { stats } = snapshot;
  const headingId = useId();
  const center = useMemo(() => summarizeGradeCenter(stats.counts), [stats.counts]);
  const values = center.values;
  return (
    <section aria-labelledby={headingId} className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b px-5 py-4">
        <h2 id={headingId} className="text-lg font-semibold text-primary">
          สรุปผล
        </h2>
        {termLabel && <p className="text-xs text-muted-foreground">รอบล่าสุด {termLabel}</p>}
      </div>
      <div className="space-y-5 p-5">
        <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="space-y-3">
              {values ? (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-6xl font-bold leading-none tabular-nums text-primary">
                      {center.level === 'ok' ? (
                        <AnimatedNumber value={values.gpa} decimals={2} format={formatCourseGpa} />
                      ) : (
                        formatCourseGpa(values.gpa)
                      )}
                    </span>
                    <span className="text-base font-medium text-muted-foreground">GPA ของวิชา</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ≈ เกรด {gradeText(values.nearest)} (จาก 4.00)
                    </span>
                    {center.level === 'low' && <LowSampleTag counted={center.people} />}
                  </div>
                </>
              ) : (
                <>
                  <SparseBadge>{SPARSE_SUMMARY}</SparseBadge>
                  <p className="text-sm text-muted-foreground">{formatGradeTally(stats.counts)}</p>
                </>
              )}
            </div>
            {values && showAchievementRing(stats.counted, stats.achievedPercent) && (
              <AnimatedRing percent={stats.achievedPercent}>
                <span className="text-center text-xs font-medium leading-tight text-muted-foreground">
                  B<br />
                  ขึ้นไป
                </span>
              </AnimatedRing>
            )}
          </div>
          {values && (
            <div className="space-y-3 border-brand lg:border-l-4 lg:pl-5">
              <p className="text-sm font-medium text-primary">{summaryLine(snapshot)}</p>
              <details className="group rounded-md border bg-slate-50 px-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  รายละเอียดการกระจายของเกรด
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pb-3 sm:grid-cols-3">
                  <Figure small label="เกรดสูงสุดที่พบ" value={gradeText(values.highest)} />
                  <Figure small label="เกรดต่ำสุดที่พบ" value={gradeText(values.lowest)} />
                  <Figure
                    small
                    label="ส่วนเบี่ยงเบนมาตรฐานของแต้มเกรด"
                    value={values.stdDev.toFixed(2)}
                    note="ยิ่งมาก เกรดยิ่งกระจายห่างกัน"
                  />
                </dl>
              </details>
            </div>
          )}
        </div>
        <dl
          className={cn(
            'grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4',
            values ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-4',
          )}
        >
          {values && (
            <>
              <Figure label="เกรดที่พบมากที่สุด" value={formatGradeList(values.modes)} />
              <Figure label="เกรดกลาง" value={formatMedian(values.median)} />
            </>
          )}
          <Figure
            label="นักศึกษาที่มีเกรด"
            value={
              <>
                <AnimatedNumber value={stats.seats} /> คน
              </>
            }
          />
          <Figure
            label="ได้ B ขึ้นไป"
            value={
              <>
                <AnimatedNumber value={stats.achieved} /> คน
              </>
            }
          />
          <Figure
            label="ได้ F"
            value={
              <>
                <AnimatedNumber value={stats.f} /> คน
              </>
            }
          />
          <Figure
            label="ถอน (W)"
            value={
              <>
                <AnimatedNumber value={stats.w} /> คน
              </>
            }
          />
        </dl>
      </div>
    </section>
  );
}

function Figure({
  label,
  value,
  note,
  small = false,
}: Readonly<{ label: string; value: ReactNode; note?: string; small?: boolean }>) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'break-words font-semibold tabular-nums text-primary',
          small ? 'text-lg' : 'text-2xl',
        )}
      >
        {value}
      </dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

function YearSection({
  snapshot,
  loading,
}: Readonly<{ snapshot: CourseSnapshot; loading: boolean }>) {
  const { years } = snapshot;
  const hasSparse = !!years && years.rows.some((r) => !r.showNumbers);
  const footer =
    years && (hasSparse || years.unplaced > 0) ? (
      <>
        {hasSparse && <p>{SPARSE_YEAR_NOTE}</p>}
        {years.unplaced > 0 && <p>{years.unplaced} คนหาชั้นปีไม่พบ จึงไม่อยู่ในตารางนี้</p>}
      </>
    ) : undefined;
  let body: ReactNode;
  if (loading) {
    body = <Skeleton className="h-28 w-full rounded-xl" />;
  } else if (years === null) {
    body = (
      <p className="text-sm text-muted-foreground">
        ยังโหลดข้อมูลชั้นปีไม่ได้ จึงยังแยกตามชั้นปีไม่ได้
      </p>
    );
  } else if (years.rows.length === 0) {
    body = (
      <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลชั้นปีของนักศึกษาในวิชานี้</p>
    );
  } else {
    body = (
      <>
        <div className="-mx-5 -my-5 hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">ชั้นปี</th>
                <th className="px-5 py-2.5 text-right font-medium">มีเกรด (คน)</th>
                <th className="px-5 py-2.5 text-right font-medium">ได้ B ขึ้นไป</th>
                <th className="px-5 py-2.5 text-right font-medium">เกรดเฉลี่ย</th>
                <th className="px-5 py-2.5 font-medium">เกรดกลาง</th>
              </tr>
            </thead>
            <tbody>
              {years.rows.map((row) => (
                <tr key={row.yearLevel} className="border-b last:border-0">
                  <td className="px-5 py-3.5 text-base font-bold text-primary">
                    {yearLevelLabel(row.yearLevel)}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">{row.stats.seats}</td>
                  <td className="px-5 py-3.5 text-right text-lg font-semibold tabular-nums text-primary">
                    {row.showNumbers ? formatPercent(row.stats.achievedPercent) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {row.showNumbers ? formatGpa(row.stats.gpa) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <span className="text-base font-semibold tabular-nums text-primary">
                        {medianOf(row) ?? '—'}
                      </span>
                      {row.level === 'low' && <LowSampleTag counted={row.stats.counted} />}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="-my-1 divide-y md:hidden">
          {years.rows.map((row) => (
            <YearListItem key={row.yearLevel} row={row} />
          ))}
        </ul>
      </>
    );
  }
  return (
    <SectionCard
      title="ภาพรวมตามชั้นปี"
      description="ชั้นปีของนักศึกษาเทียบกับปีการศึกษาล่าสุด แสดงเฉพาะชั้นปีที่มีนักศึกษาในวิชานี้"
      footer={footer}
    >
      {body}
    </SectionCard>
  );
}

// The middle grade of one year level; null while there are too few people.
function medianOf(row: YearRow): string | null {
  const values = summarizeGradeCenter(row.stats.counts).values;
  return values && row.showNumbers ? formatMedian(values.median) : null;
}

function YearListItem({ row }: Readonly<{ row: YearRow }>) {
  const median = medianOf(row);
  return (
    <li className="space-y-1 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold text-primary">{yearLevelLabel(row.yearLevel)}</p>
        {row.level === 'low' && <LowSampleTag counted={row.stats.counted} />}
      </div>
      <p className="text-sm text-muted-foreground">
        {row.showNumbers
          ? `ได้ B ขึ้นไป ${formatPercent(row.stats.achievedPercent)} · เกรดเฉลี่ย ${formatGpa(row.stats.gpa)}${median ? ` · เกรดกลาง ${median}` : ''} · ${row.stats.seats} คน`
          : `มีเกรด ${row.stats.seats} คน · ตัวเลข —`}
      </p>
    </li>
  );
}

function GoalRow({ goal, sparse }: Readonly<{ goal: GoalItem; sparse: boolean }>) {
  const Icon =
    goal.state === 'met' ? CheckCircle2 : goal.state === 'unmet' ? AlertCircle : CircleDashed;
  const tone =
    goal.state === 'met'
      ? 'text-emerald-600'
      : goal.state === 'unmet'
        ? 'text-amber-600'
        : 'text-slate-400';
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
    <SectionCard
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
        <ul className="-my-3 divide-y divide-slate-100">
          {goals.items.map((goal) => (
            <GoalRow key={goal.cloId} goal={goal} sparse={goals.sparse} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function GradesSection({ snapshot }: Readonly<{ snapshot: CourseSnapshot }>) {
  const { grades } = snapshot;
  if (grades.scored === 0) {
    return (
      <SectionCard title="การกระจายเกรด">
        <p className="text-sm text-muted-foreground">ยังไม่มีเกรด A ถึง F</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard
      title="การกระจายเกรด"
      description="เกรดล่าสุดของนักศึกษาแต่ละคนในวิชานี้ (A ถึง F)"
      aside={`รวม A ถึง F ${grades.scored} คน`}
    >
      <div
        role="img"
        aria-label={grades.segments
          .map((s) => `${GRADE_LABELS[s.grade]} ${s.count} คน`)
          .join(' · ')}
        className="flex h-9 overflow-hidden rounded-lg bg-slate-100"
      >
        {grades.segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <span
              key={s.grade}
              className="flex items-center justify-center overflow-hidden whitespace-nowrap border-r border-background text-xs font-medium last:border-r-0"
              style={{
                width: `${s.percent}%`,
                backgroundColor: GRADE_BAR[s.grade].fill,
                color: GRADE_BAR[s.grade].text,
              }}
            >
              {s.percent >= 25
                ? `${GRADE_LABELS[s.grade]} (${formatPercent(s.percent)})`
                : s.percent >= 6
                  ? GRADE_LABELS[s.grade]
                  : ''}
            </span>
          ))}
      </div>
      <dl className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-8">
        {grades.segments.map((s) => (
          <div key={s.grade} className="space-y-0.5 text-center">
            <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: GRADE_BAR[s.grade].fill }}
              />
              {GRADE_LABELS[s.grade]}
            </dt>
            <dd className="text-xl font-semibold tabular-nums text-primary">
              {s.count} <span className="text-xs font-normal text-muted-foreground">คน</span>
            </dd>
            <dd className="text-xs tabular-nums text-muted-foreground">{oneDecimal(s.percent)}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t pt-3 text-sm text-muted-foreground">
        ได้ F <span className="font-semibold text-primary">{grades.f}</span> คน · ถอน (W){' '}
        <span className="font-semibold text-primary">{grades.w}</span> คน · ยังไม่สมบูรณ์ (I){' '}
        <span className="font-semibold text-primary">{grades.incomplete}</span> คน
        {grades.notGraded > 0 && (
          <>
            {' '}
            · ไม่คิดเกรด (S, U){' '}
            <span className="font-semibold text-primary">{grades.notGraded}</span> คน
          </>
        )}
      </p>
    </SectionCard>
  );
}

function TrendSection({ snapshot }: Readonly<{ snapshot: CourseSnapshot }>) {
  const { trend } = snapshot;
  return (
    <SectionCard
      title="แนวโน้มรายภาคเรียน"
      description={trend.enough && trend.change ? changeLine(trend.change) : undefined}
    >
      {trend.enough ? (
        <ul className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {trend.terms.map((term) => (
            <li
              key={term.key}
              className={cn(
                'relative space-y-2 rounded-xl border p-4',
                term.isLatest ? 'border-2 border-brand bg-brand-light' : 'bg-card',
              )}
            >
              {term.isLatest && (
                <span className="absolute -top-3 right-3 rounded-md bg-brand px-2 py-0.5 text-xs font-medium text-brand-foreground">
                  ภาคล่าสุด
                </span>
              )}
              <p className="text-sm font-semibold text-primary">{term.label}</p>
              {term.showNumbers ? (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-4xl font-bold leading-none tabular-nums text-primary">
                      {formatPercent(term.percent)}
                    </span>
                    <span className="text-sm text-muted-foreground">ได้ B ขึ้นไป</span>
                  </p>
                  <div
                    role="img"
                    aria-label={`ได้ B ขึ้นไป ${formatPercent(term.percent)}`}
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        term.isLatest ? 'bg-brand' : 'bg-slate-400',
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, term.percent))}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{SPARSE_LABEL} · ตัวเลข —</p>
              )}
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                มีเกรด {term.students} คน
                {term.level === 'low' && <LowSampleTag counted={term.students} />}
              </p>
              {term.delta !== null && (
                <Badge tone="neutral" className="px-2.5 py-1 text-xs">
                  % B ขึ้นไป เทียบภาคก่อน {formatPointsChange(term.delta)} จุด
                </Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {SPARSE_TREND} (มี {trend.termCount} ภาคเรียน ต้องมีอย่างน้อย {MIN_TERMS_FOR_TREND}{' '}
          ภาคเรียน)
        </p>
      )}
    </SectionCard>
  );
}
