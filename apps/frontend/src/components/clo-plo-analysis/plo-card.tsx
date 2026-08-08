import type { RadarPoint } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function PloCard({
  plo,
  description,
  isAchieved,
}: {
  plo: RadarPoint;
  description: string | null;
  isAchieved: boolean;
}) {
  const hasValue = plo.value !== null;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{plo.code}</p>
            <p className="font-medium text-primary">{plo.name}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              !hasValue
                ? 'bg-slate-100 text-slate-600'
                : isAchieved
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-600',
            )}
          >
            {!hasValue ? 'ไม่มีข้อมูล' : isAchieved ? 'Achieved' : 'In Progress'}
          </span>
        </div>

        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        <div className="flex items-center gap-3">
          <Progress value={plo.value ?? 0} className="flex-1" />
          <span className="w-12 text-right text-sm font-medium text-primary">
            {hasValue ? `${Math.round(plo.value!)}%` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
