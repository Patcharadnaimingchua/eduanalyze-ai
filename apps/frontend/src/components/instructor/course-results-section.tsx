'use client';

import type { Grade, SemesterAchievement } from '@eduanalyze-ai/shared-types';
import { GradeDistributionChart } from './grade-distribution-chart';
import { SemesterTrendChart } from './semester-trend-chart';

// Both charts answer "what grades did students get" — one for now, one
// across semesters — so they read as a pair. Neither chart carries its own
// heading, which is why they need one here to stay distinguishable.
export function CourseResultsSection({
  distribution,
  trend,
}: {
  distribution: Record<Grade, number>;
  trend: SemesterAchievement[];
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">การกระจายเกรด</p>
        <GradeDistributionChart distribution={distribution} />
        <p className="text-xs text-muted-foreground">
          นับผลการเรียนครั้งล่าสุดของแต่ละคน รวม W/I/S/U ด้วย
        </p>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-sm font-medium text-primary">แนวโน้มรายเทอม</p>
        <SemesterTrendChart trend={trend} />
      </div>
    </div>
  );
}
