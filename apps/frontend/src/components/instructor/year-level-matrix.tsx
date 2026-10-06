import Link from 'next/link';
import { yearLevelLabel } from '@/lib/course-timeline-summary';
import { formatPercent } from '@/lib/format-percent';
import {
  STATUS_META,
  type GroupStats,
  type Matrix,
  type MatrixCell,
  type OverviewStatus,
} from '@/lib/instructor-overview';
import { BAR_TONE_CLASSES } from '@/lib/tone';
import { cn } from '@/lib/utils';
import { LowSampleTag, StatusBadge } from './overview-parts';

const TONE = { met: 'success', near: 'warning', below: 'danger', none: 'neutral' } as const;

// One cell of the table: the share at B or above as the big number, the seats
// under it, and the status in words (short) beside a colour stripe, so the
// colour is never the only signal. An empty cell is a dash.
function Cell({ cell }: Readonly<{ cell: MatrixCell | null }>) {
  if (!cell) {
    return (
      <span className="text-muted-foreground" aria-label="ไม่มีนักศึกษา">
        –
      </span>
    );
  }
  return <Figure stats={cell.stats} status={cell.status} />;
}

function Figure({ stats, status }: Readonly<{ stats: GroupStats; status: OverviewStatus }>) {
  return (
    <span className="flex items-stretch gap-2">
      <span aria-hidden="true" className={cn('w-1 shrink-0 rounded', BAR_TONE_CLASSES[TONE[status]])} />
      <span className="min-w-0">
        <span className="block text-lg font-semibold leading-tight tabular-nums text-primary">
          {formatPercent(stats.achievedPercent)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">{STATUS_META[status].label}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {stats.seats} ที่นั่ง
          {stats.f > 0 && ` · F ${stats.f}`}
          {stats.w > 0 && ` · W ${stats.w}`}
          {stats.lowSample && stats.counted > 0 && <LowSampleTag counted={stats.counted} />}
        </span>
      </span>
    </span>
  );
}

const href = (id: string) => `/instructor/courses/${id}`;

// Every course against every year level that has someone, one number in every
// cell. A table on wide screens (the course name is the link; the row is
// clickable through it) and one card per course on phones.
export function YearLevelMatrix({ matrix }: Readonly<{ matrix: Matrix }>) {
  const { levels, rows, footer } = matrix;
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">ได้ B ขึ้นไป แยกตามวิชาและชั้นปี</caption>
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2 font-medium">วิชา</th>
              {levels.map((l) => (
                <th key={l} scope="col" className="px-4 py-2 font-medium">
                  {yearLevelLabel(l)}
                </th>
              ))}
              <th scope="col" className="px-4 py-2 font-medium">รวมวิชานี้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.course.courseId} className="relative border-b hover:bg-slate-50">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <Link
                    href={href(row.course.courseId)}
                    className="inline-flex min-h-11 items-center before:absolute before:inset-0 focus-visible:outline-none focus-visible:before:ring-2 focus-visible:before:ring-ring"
                  >
                    <span>
                      <span className="block text-xs text-muted-foreground">{row.course.code}</span>
                      <span className="block font-semibold text-primary">{row.course.name}</span>
                    </span>
                  </Link>
                </th>
                {row.cells.map((c, i) => (
                  <td key={levels[i]} className="px-4 py-3">
                    <Cell cell={c} />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <Figure stats={row.total} status={row.totalStatus} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-primary">ทุกวิชารวมกัน</th>
              {footer.cells.map((c, i) => (
                <td key={levels[i]} className="px-4 py-3">
                  <Cell cell={c} />
                </td>
              ))}
              <td className="px-4 py-3">
                <Figure stats={footer.total} status={footer.totalStatus} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.course.courseId}>
            <Link
              href={href(row.course.courseId)}
              className="block space-y-3 rounded-xl border bg-card p-4 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">{row.course.code}</span>
                  <span className="block font-semibold text-primary">{row.course.name}</span>
                </span>
                <StatusBadge status={row.totalStatus} className="shrink-0" />
              </span>
              <span className="block divide-y">
                {levels.map((l, i) => (
                  <span key={l} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-muted-foreground">{yearLevelLabel(l)}</span>
                    <Cell cell={row.cells[i]} />
                  </span>
                ))}
                <span className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-sm font-medium text-primary">รวมวิชานี้</span>
                  <Figure stats={row.total} status={row.totalStatus} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
