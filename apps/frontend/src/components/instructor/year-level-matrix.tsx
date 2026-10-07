import Link from 'next/link';
import { yearLevelLabel } from '@/lib/course-timeline-summary';
import { SPARSE_SUMMARY } from '@/lib/course-snapshot';
import { centerLine, formatCourseGpa, formatMedian, summarizeGradeCenter } from '@/lib/grade-center';
import type { GroupStats, Matrix, MatrixCell } from '@/lib/instructor-overview';
import { cn } from '@/lib/utils';
import { LowSampleTag } from './overview-parts';

// One cell of the table: the middle grade as the big figure, the seats and the
// course GPA under it. Under 5 graded people the middle is not given, only the
// seats. An empty cell is a dash.
function Cell({ cell, end = false }: Readonly<{ cell: MatrixCell | null; end?: boolean }>) {
  if (!cell) {
    return (
      <span className="text-muted-foreground" aria-label="ไม่มีนักศึกษา">
        –
      </span>
    );
  }
  return <Figure stats={cell.stats} end={end} />;
}

// `end` right-aligns the figure, for the phone cards where it sits at the end of a row.
function Figure({ stats, end = false }: Readonly<{ stats: GroupStats; end?: boolean }>) {
  const center = summarizeGradeCenter(stats.counts);
  const values = center.values;
  return (
    <span className={cn('block min-w-0', end && 'text-right')}>
      <span className="block text-lg font-semibold leading-tight tabular-nums text-primary">
        {values ? (
          formatMedian(values.median)
        ) : (
          <span className="text-sm font-normal text-muted-foreground">ข้อมูลยังน้อย</span>
        )}
      </span>
      <span
        className={cn(
          'flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground',
          end && 'justify-end',
        )}
      >
        {stats.seats} ที่นั่ง
        {values && ` · GPA ${formatCourseGpa(values.gpa)}`}
        {stats.f > 0 && ` · F ${stats.f}`}
        {stats.w > 0 && ` · W ${stats.w}`}
        {center.level === 'low' && <LowSampleTag counted={center.people} />}
      </span>
    </span>
  );
}

// "เกรดที่พบมากที่สุด B+ · เกรดกลาง B · GPA วิชา 2.84", the same line as under the
// course name on the course page.
const courseLine = (stats: GroupStats): string =>
  centerLine(summarizeGradeCenter(stats.counts)) ?? SPARSE_SUMMARY;

const href = (id: string) => `/instructor/courses/${id}`;

// Every course against every year level that has someone, one figure in every
// cell. A table on wide screens (the course name is the link; the row is
// clickable through it) and one card per course on phones.
export function YearLevelMatrix({ matrix }: Readonly<{ matrix: Matrix }>) {
  const { levels, rows, footer } = matrix;
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">เกรดกลาง แยกตามวิชาและชั้นปี</caption>
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
                      <span className="mt-0.5 block max-w-md text-xs font-normal text-muted-foreground">
                        {courseLine(row.total)}
                      </span>
                    </span>
                  </Link>
                </th>
                {row.cells.map((c, i) => (
                  <td key={levels[i]} className="px-4 py-3 align-top">
                    <Cell cell={c} />
                  </td>
                ))}
                <td className="px-4 py-3 align-top">
                  <Figure stats={row.total} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-primary">ทุกวิชารวมกัน</th>
              {footer.cells.map((c, i) => (
                <td key={levels[i]} className="px-4 py-3 align-top">
                  <Cell cell={c} />
                </td>
              ))}
              <td className="px-4 py-3 align-top">
                <Figure stats={footer.total} />
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
              <span className="block min-w-0">
                <span className="block text-xs text-muted-foreground">{row.course.code}</span>
                <span className="block break-words font-semibold text-primary">{row.course.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{courseLine(row.total)}</span>
              </span>
              <span className="block divide-y">
                {levels.map((l, i) => (
                  <span key={l} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-muted-foreground">{yearLevelLabel(l)}</span>
                    <Cell cell={row.cells[i]} end />
                  </span>
                ))}
                <span className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-sm font-medium text-primary">รวมวิชานี้</span>
                  <Figure stats={row.total} end />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
