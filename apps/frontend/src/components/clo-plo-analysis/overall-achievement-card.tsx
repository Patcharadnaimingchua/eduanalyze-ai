import { cn } from '@/lib/utils';
import { formatFiveScale } from '@/lib/five-scale';
import { SCORE_BANDS, type ScoreBandKey } from '@/lib/plo-score-bands';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// No chart library in this project (confirmed — plain SVG ring, same
// no-dependency style as the hand-rolled linear Progress component).
//
// Ring and status breakdown were two separate Cards — same data (both
// summarize the radar's PLO values), so a student had to read them as two
// unrelated widgets. Now one Card, two halves.
export function OverallAchievementCard({
  percent,
  isAchieved,
  bandCounts,
  noDataCount,
}: Readonly<{
  percent: number | null;
  isAchieved: boolean;
  bandCounts: Record<ScoreBandKey, number>;
  noDataCount: number;
}>) {
  const clamped = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const badgeToneClassName =
    percent === null
      ? 'bg-slate-100 text-slate-600'
      : isAchieved
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-slate-100 text-slate-600';
  const badgeLabel = percent === null ? 'ไม่มีข้อมูล' : isAchieved ? 'On Track' : 'In Progress';

  return (
    <Card>
      <CardHeader>
        <CardTitle>ภาพรวมความสำเร็จของ PLO</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:divide-x sm:divide-slate-100">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative h-[132px] w-[132px]">
            <svg width={132} height={132} viewBox="0 0 140 140" className="-rotate-90">
              <circle cx={70} cy={70} r={RADIUS} strokeWidth={12} className="fill-none stroke-slate-100" />
              {percent !== null && (
                <circle
                  cx={70}
                  cy={70}
                  r={RADIUS}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  className="fill-none stroke-brand transition-all"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center leading-tight">
                <p className="text-2xl font-semibold text-primary">
                  {percent === null ? '—' : `${formatFiveScale(percent)} / 5.0`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">คะแนนเฉลี่ย</p>
              </div>
            </div>
          </div>
          <span className={cn('rounded-full px-3 py-1 text-sm font-medium', badgeToneClassName)}>
            {badgeLabel}
          </span>
        </div>

        <div className="space-y-3 sm:pl-6">
          <h3 className="text-sm font-medium text-muted-foreground">สรุปตามสถานะ</h3>
          {SCORE_BANDS.map((band) => (
            <div key={band.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={cn('h-2 w-2 rounded-full', band.indicatorClassName)} aria-hidden="true" />
                {band.label}
              </span>
              <span className="font-medium text-primary">{bandCounts[band.key]} PLO</span>
            </div>
          ))}
          {noDataCount > 0 && (
            <p className="border-t border-slate-100 pt-3 text-xs text-muted-foreground">
              ไม่มีข้อมูล {noDataCount} PLO
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
