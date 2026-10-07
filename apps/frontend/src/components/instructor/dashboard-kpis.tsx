import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatGpa, type OverallOverview } from '@/lib/instructor-overview';
import { formatPercent } from '@/lib/format-percent';
import type { Headcount } from '@/lib/headcount';
import { GoalBar, LowSampleTag, StatusBadge } from './overview-parts';

// Three numbers. The first, how many reached B or above against the goal, is
// the biggest on the page; the grade average and the head count are secondary.
export function DashboardKpis({
  overall,
  gpaNote,
  headcount,
  trend,
}: Readonly<{
  overall: OverallOverview;
  // Why the grade average is "–" when it is; null when it is shown.
  gpaNote: string | null;
  headcount: Headcount;
  trend: ReactNode;
}>) {
  const { stats } = overall;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="border-t-4 border-t-brand">
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm font-medium text-muted-foreground">ได้ B ขึ้นไป (เทียบเป้า)</p>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-6xl font-semibold leading-none tabular-nums text-primary">
              {formatPercent(stats.achievedPercent)}
            </span>
            <span className="text-base text-muted-foreground">
              {overall.target === null ? 'ยังไม่มีเป้า' : `เป้า ${formatPercent(overall.target)}`}
            </span>
          </p>
          <GoalBar percent={stats.achievedPercent} target={overall.target} status={overall.status} />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={overall.status} />
            {stats.lowSample && stats.graded > 0 && <LowSampleTag counted={stats.graded} />}
            {trend}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 pt-5">
          <p className="text-sm font-medium text-muted-foreground">เกรดเฉลี่ยรวม</p>
          <p className="text-4xl font-semibold leading-tight tabular-nums text-primary">
            {formatGpa(stats.gpa)}
            {stats.gpa !== null && <span className="ml-1 text-base font-normal text-muted-foreground">จาก 4.00</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {gpaNote ?? 'ถ่วงตามหน่วยกิต ไม่รวม W, I, S, U'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 pt-5">
          <p className="text-sm font-medium text-muted-foreground">นักศึกษาที่คุณสอน</p>
          <p className="text-4xl font-semibold leading-tight tabular-nums text-primary">
            {headcount.value}
            <span className="ml-1 text-base font-normal text-muted-foreground">{headcount.unit}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {headcount.note ?? (headcount.unit === 'ที่นั่ง' ? 'นับตามวิชา (บางคนอาจเรียนหลายวิชา)' : ' ')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
