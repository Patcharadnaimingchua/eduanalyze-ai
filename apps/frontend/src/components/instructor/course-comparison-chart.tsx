'use client';

import Link from 'next/link';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { achievementStatus } from '@/lib/achievement-status';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <CardTitle className="text-base">เปรียบเทียบผลสัมฤทธิ์ระหว่างวิชา</CardTitle>
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
          return (
            <Link
              key={course.courseId}
              href={`/instructor/courses/${course.courseId}`}
              className="block rounded-md transition hover:bg-slate-50"
              title={
                hasStudents
                  ? `${course.achievementPercent.toFixed(1)}% (${course.studentCount} คน)`
                  : 'ยังไม่มีนักศึกษา'
              }
            >
              <div className="flex items-center gap-3 px-2 py-1.5">
                <div className="w-40 shrink-0 truncate text-sm">
                  <span className="text-muted-foreground">{course.code}</span>{' '}
                  <span className="text-primary">{course.name}</span>
                </div>
                <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
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
                <div className="flex w-44 shrink-0 items-center justify-end gap-2">
                  <span className="text-sm text-muted-foreground">
                    {hasStudents
                      ? `${Math.round(course.achievementPercent)}% (${course.studentCount})`
                      : 'ไม่มีข้อมูล'}
                  </span>
                  {hasStudents && <Badge tone={status.tone}>{status.label}</Badge>}
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
