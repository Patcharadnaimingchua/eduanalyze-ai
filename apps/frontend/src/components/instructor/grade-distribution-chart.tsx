'use client';

import type { Grade } from '@eduanalyze-ai/shared-types';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { gradeBadgeTone, type GradeBadgeTone } from '@/lib/grade-badge-color';
import { cn } from '@/lib/utils';

// No chart library in this project — hand-built DOM bars (same approach as
// components/ui/progress.tsx), one column per Grade in GRADE_OPTIONS order.
const BAR_TONE_CLASSES: Record<GradeBadgeTone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-slate-300',
};

export function GradeDistributionChart({
  distribution,
}: {
  distribution: Record<Grade, number>;
}) {
  const maxCount = Math.max(...GRADE_OPTIONS.map((grade) => distribution[grade] ?? 0), 1);

  return (
    <div className="flex h-56 items-end gap-3">
      {GRADE_OPTIONS.map((grade) => {
        const count = distribution[grade] ?? 0;
        const heightPercent = (count / maxCount) * 100;
        return (
          <div key={grade} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{count}</span>
            <div className="flex h-40 w-full items-end">
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  BAR_TONE_CLASSES[gradeBadgeTone(grade)],
                )}
                style={{ height: `${heightPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {GRADE_LABELS[grade]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
