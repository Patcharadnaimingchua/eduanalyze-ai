import { cn } from '@/lib/utils';
import { formatFiveScale } from '@/lib/five-scale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// No chart library in this project (confirmed — plain SVG ring, same
// no-dependency style as the hand-rolled linear Progress component).
export function OverallAchievementCard({
  percent,
  isAchieved,
}: {
  percent: number | null;
  isAchieved: boolean;
}) {
  const clamped = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">ภาพรวมความสำเร็จของ PLO</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pt-2">
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
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            percent === null
              ? 'bg-slate-100 text-slate-600'
              : isAchieved
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-600',
          )}
        >
          {percent === null ? 'ไม่มีข้อมูล' : isAchieved ? 'On Track' : 'In Progress'}
        </span>
      </CardContent>
    </Card>
  );
}
