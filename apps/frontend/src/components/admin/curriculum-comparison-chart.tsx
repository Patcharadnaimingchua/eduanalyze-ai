'use client';

import type { SystemCurriculumEntry } from '@eduanalyze-ai/shared-types';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Sibling of instructor/course-comparison-chart.tsx — same hand-built DOM
// bars (no chart library in this project), comparing curricula instead of
// courses.
//
// No achievement badge here, unlike the course chart: averagePloValue is a
// mean attainment score, not the "% of students at B or above" that
// achievementStatus judges, so putting that badge on it would label the
// number as something it isn't. The bar colour still uses the shared
// threshold scale, which reads as "higher is better" without asserting a
// pass/fail verdict.
export function CurriculumComparisonChart({
  curricula,
  threshold,
}: {
  curricula: SystemCurriculumEntry[];
  threshold: number | null;
}) {
  const sorted = [...curricula].sort(
    (a, b) => (a.averagePloValue ?? Infinity) - (b.averagePloValue ?? Infinity),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เปรียบเทียบผลสัมฤทธิ์ PLO ระหว่างหลักสูตร</CardTitle>
        <p className="text-xs text-muted-foreground">
          คะแนน PLO เฉลี่ยของนักศึกษาในแต่ละหลักสูตร เรียงจากหลักสูตรที่ต้องดูแลก่อน
          — คำนวณจากเกรดรายวิชา ไม่ใช่ % นักศึกษาที่ผ่านเกณฑ์
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((curriculum) => {
          const value = curriculum.averagePloValue;
          return (
            <div key={curriculum.curriculumId} className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-48 shrink-0 truncate text-sm">
                <span className="text-muted-foreground">{curriculum.programCode}</span>{' '}
                <span className="text-primary">ฉบับ {curriculum.version}</span>
              </div>
              <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                {value !== null && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'h-full rounded transition-all',
                          ploProgressBarColorClassName(value, threshold),
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {Math.round(value)}% ({curriculum.studentCount} คน)
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex w-36 shrink-0 items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">
                  {value === null
                    ? 'ไม่มีข้อมูล'
                    : `${Math.round(value)}% (${curriculum.studentCount} คน)`}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
