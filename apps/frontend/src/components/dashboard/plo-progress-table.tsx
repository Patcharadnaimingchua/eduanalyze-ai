import type { RadarPoint } from '@eduanalyze-ai/shared-types';
import { formatFiveScale } from '@/lib/five-scale';
import { Progress } from '@/components/ui/progress';

// Same 0–5 scale as the radar it sits under, so a PLO never reads as
// "2.5" on the chart and "50%" in the list right below it. The scale's top is
// written with the same formatter as the value ("5.0" or "5.00"), so the two
// always agree.
export function PloProgressTable({
  radar,
  formatValue = formatFiveScale,
}: Readonly<{
  radar: RadarPoint[];
  formatValue?: (percent: number | null, noDataLabel?: string) => string;
}>) {
  return (
    <ul className="space-y-4">
      {radar.map((plo) => (
        <li key={plo.ploId} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium text-primary">{plo.code}</span>{' '}
              <span className="text-muted-foreground">{plo.name}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-primary">
              {formatValue(plo.value, 'ไม่มีข้อมูล')}
              {plo.value !== null && (
                <span className="font-normal text-muted-foreground"> / {formatValue(100)}</span>
              )}
            </span>
          </div>
          <Progress value={plo.value ?? 0} label={`${plo.code} ${plo.name}`} />
        </li>
      ))}
    </ul>
  );
}
