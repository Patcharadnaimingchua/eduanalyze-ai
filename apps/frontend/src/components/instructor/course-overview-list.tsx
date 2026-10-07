'use client';

import Link from 'next/link';
import { useState } from 'react';
import { yearLevelLabel } from '@/lib/course-timeline-summary';
import { formatPercent } from '@/lib/format-percent';
import {
  formatGpa,
  type CourseOverview,
  type GroupStats,
  type OverviewStatus,
  type YearLevelCell,
} from '@/lib/instructor-overview';
import { cn } from '@/lib/utils';
import { PageSection } from '@/components/layout/page-section';
import { GoalBar, LowSampleTag, StatusBadge } from './overview-parts';

type View = 'course' | 'year';

interface Row {
  key: string;
  title: string;
  code?: string;
  href?: string;
  stats: GroupStats;
  target: number | null;
  status: OverviewStatus;
  unit: 'คน' | 'ที่นั่ง';
}

// Where each group stands against its goal. By course (a table on wide screens,
// cards on phones; one course is one card) or by year level. A course row is
// one big link to that course. Furthest from the goal comes first.
export function CourseOverviewList({
  overviews,
  yearCells,
  overallTarget,
  overallStatusOf,
}: Readonly<{
  overviews: CourseOverview[];
  // null = year levels could not be loaded: the switch is hidden.
  yearCells: YearLevelCell[] | null;
  overallTarget: number | null;
  overallStatusOf: (percent: number | null) => OverviewStatus;
}>) {
  const [view, setView] = useState<View>('course');
  const canSplit = yearCells !== null && yearCells.length > 0;
  const active: View = canSplit ? view : 'course';

  const rows: Row[] =
    active === 'course'
      ? overviews.map((o) => ({
          key: o.course.courseId,
          title: o.course.name,
          code: o.course.code,
          href: `/instructor/courses/${o.course.courseId}`,
          stats: o.stats,
          target: o.target,
          status: o.status,
          unit: 'คน',
        }))
      : (yearCells ?? []).map((c) => ({
          key: `y${c.yearLevel}`,
          title: yearLevelLabel(c.yearLevel),
          stats: c.stats,
          target: overallTarget,
          status: overallStatusOf(c.stats.achievedPercent),
          unit: 'ที่นั่ง',
        }));

  return (
    <PageSection
      title={active === 'course' ? 'ภาพรวมแต่ละวิชา' : 'ภาพรวมแต่ละชั้นปี'}
      description={
        active === 'course'
          ? 'เรียงจากวิชาที่ห่างเป้ามากที่สุดก่อน กดที่วิชาเพื่อดูรายละเอียด'
          : 'นับเป็นที่นั่ง: คนที่เรียนหลายวิชาจะนับในแต่ละวิชา'
      }
      actions={
        canSplit && (
          <div role="group" aria-label="เลือกมุมมอง" className="flex gap-2">
            {(
              [
                ['course', 'ตามวิชา'],
                ['year', 'ตามชั้นปี'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={active === key}
                onClick={() => setView(key)}
                className={cn(
                  'min-h-11 rounded-md border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-primary hover:bg-accent',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )
      }
    >
      {rows.length === 1 && active === 'course' ? (
        <RowCard row={rows[0]} />
      ) : (
        <>
          <RowTable rows={rows} />
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.key}>
                <RowCard row={row} />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageSection>
  );
}

function Name({ row }: Readonly<{ row: Row }>) {
  return (
    <span className="min-w-0">
      {row.code && <span className="block text-xs text-muted-foreground">{row.code}</span>}
      <span className="block font-semibold text-primary">{row.title}</span>
    </span>
  );
}

function Tags({ row }: Readonly<{ row: Row }>) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>
        {row.stats.seats} {row.unit}
      </span>
      {row.stats.lowSample && row.stats.graded > 0 && <LowSampleTag counted={row.stats.graded} />}
    </span>
  );
}

// Phones, and the single-course case: one card per row, the whole card a link
// when the row has somewhere to go.
function RowCard({ row }: Readonly<{ row: Row }>) {
  const body = (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <Name row={row} />
        <StatusBadge status={row.status} className="shrink-0" />
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-4xl font-semibold leading-none tabular-nums text-primary">
          {formatPercent(row.stats.achievedPercent)}
        </span>
        <span className="text-sm text-muted-foreground">
          ได้ B ขึ้นไป{row.target !== null && ` · เป้า ${formatPercent(row.target)}`}
        </span>
      </p>
      <GoalBar percent={row.stats.achievedPercent} target={row.target} status={row.status} />
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>เกรดเฉลี่ย {formatGpa(row.stats.gpa)}</span>
        <Tags row={row} />
        {row.stats.f > 0 && <span>F {row.stats.f}</span>}
        {row.stats.w > 0 && <span>W {row.stats.w}</span>}
      </p>
    </div>
  );
  const shell = 'block overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm';
  return row.href ? (
    <Link
      href={row.href}
      className={cn(shell, 'transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
    >
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

// Wide screens. The link in the first cell is stretched over the whole row
// (a ::before the size of the row), so the row is one target at least 44px tall.
function RowTable({ rows }: Readonly<{ rows: Row[] }>) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">{rows[0]?.code ? 'วิชา' : 'ชั้นปี'}</th>
            <th className="w-[34%] px-4 py-2 font-medium">ได้ B ขึ้นไป (เส้นดำคือเป้า)</th>
            <th className="px-4 py-2 font-medium">เกรดเฉลี่ย</th>
            <th className="px-4 py-2 font-medium">{rows[0]?.unit === 'ที่นั่ง' ? 'ที่นั่ง' : 'นักศึกษา'}</th>
            <th className="px-4 py-2 font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="relative border-b last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3">
                {row.href ? (
                  <Link
                    href={row.href}
                    className="inline-flex min-h-11 items-center before:absolute before:inset-0 focus-visible:outline-none focus-visible:before:ring-2 focus-visible:before:ring-ring"
                  >
                    <Name row={row} />
                  </Link>
                ) : (
                  <Name row={row} />
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <GoalBar className="flex-1" percent={row.stats.achievedPercent} target={row.target} status={row.status} />
                  <span className="w-12 shrink-0 text-right text-base font-semibold tabular-nums text-primary">
                    {formatPercent(row.stats.achievedPercent)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums">{formatGpa(row.stats.gpa)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <Tags row={row} />
                {(row.stats.f > 0 || row.stats.w > 0) && (
                  <span className="block text-xs">
                    {row.stats.f > 0 && `F ${row.stats.f}`}
                    {row.stats.f > 0 && row.stats.w > 0 && ' · '}
                    {row.stats.w > 0 && `W ${row.stats.w}`}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
