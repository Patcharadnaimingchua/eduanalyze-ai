'use client';

import Link from 'next/link';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { achievementStatus } from '@/lib/achievement-status';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// No chart library in this project — hand-built DOM bars, same approach as
// grade-distribution-chart.tsx (vertical) but horizontal here.
//
// The bar reuses ploProgressBarColorClassName rather than the badge's tone:
// it keeps an amber "just under the bar" band that the pass/fail badge
// deliberately doesn't have, so a course at 69% still reads differently
// from one at 20%.
export function CourseComparisonChart({ courses }: { courses: InstructorCourseSummary[] }) {
  const sorted = [...courses].sort((a, b) => a.achievementPercent - b.achievementPercent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>เปรียบเทียบระหว่างวิชา (สัดส่วนที่ได้ B ขึ้นไป)</CardTitle>
        <p className="text-xs text-muted-foreground">
          % นักศึกษาที่ได้เกรด B ขึ้นไปในแต่ละวิชา เรียงจากวิชาที่ต้องดูแลก่อน
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((course) => {
          const hasStudents = course.studentCount > 0;
          const status = achievementStatus(
            course.achievementPercent,
            course.achievementThreshold,
          );
          const tooltipText = hasStudents
            ? `${course.achievementPercent.toFixed(1)}% (${course.studentCount} คน)`
            : 'ยังไม่มีนักศึกษา';
          return (
            <Tooltip key={course.courseId}>
              <TooltipTrigger asChild>
                <Link
                  href={`/instructor/courses/${course.courseId}`}
                  className="block rounded-md transition hover:bg-slate-50"
                >
                  {/* Name above the bar on phones (fixed side columns overflowed 360px);
                      side by side from sm. The name wraps instead of truncating. */}
                  <div className="flex flex-col gap-1.5 px-2 py-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <div className="text-sm sm:w-40 sm:shrink-0">
                      <span className="text-muted-foreground">{course.code}</span>{' '}
                      <span className="text-primary">{course.name}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-5 min-w-0 flex-1 overflow-hidden rounded bg-slate-100">
                        {hasStudents && (
                          <div
                            className={cn(
                              'h-full rounded transition-all',
                              ploProgressBarColorClassName(
                                course.achievementPercent,
                                course.achievementThreshold,
                              ),
                            )}
                            style={{ width: `${course.achievementPercent}%` }}
                          />
                        )}
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2 sm:w-44">
                        <span className="text-sm text-muted-foreground">
                          {hasStudents
                            ? `${Math.round(course.achievementPercent)}% (${course.studentCount})`
                            : 'ไม่มีข้อมูล'}
                        </span>
                        {hasStudents && <Badge tone={status.tone}>{status.label}</Badge>}
                      </div>
                    </div>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
          );
        })}
      </CardContent>
    </Card>
  );
}
