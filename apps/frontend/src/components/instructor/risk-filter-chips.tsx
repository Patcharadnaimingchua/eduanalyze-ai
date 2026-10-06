'use client';

import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import { ALL, type RiskCounts, type RiskFilter } from '@/lib/student-directory';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// The risk buttons double as the numbers: each shows how many people it would
// leave. 44px tall at every width (touch), the design system's Button "lg" height.
export function RiskFilterChips({
  counts,
  value,
  onChange,
}: Readonly<{
  counts: RiskCounts;
  value: RiskFilter;
  onChange: (risk: RiskFilter) => void;
}>) {
  const options: { value: RiskFilter; label: string; count: number; level?: RiskLevel }[] = [
    { value: ALL, label: 'ทั้งหมด', count: counts.total },
    ...RISK_LEVEL_ORDER.map((level) => ({
      value: level,
      label: RISK_LEVEL_LABELS[level],
      count: counts[level],
      level,
    })),
  ];

  return (
    <div role="group" aria-label="กรองตามระดับความเสี่ยง" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={selected ? 'default' : 'outline'}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn('h-11 gap-2', selected && 'font-semibold')}
          >
            {option.label}
            {option.level && option.count > 0 ? (
              <Badge tone={RISK_LEVEL_TONES[option.level]}>{option.count}</Badge>
            ) : (
              <span className={selected ? undefined : 'text-muted-foreground'}>{option.count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
