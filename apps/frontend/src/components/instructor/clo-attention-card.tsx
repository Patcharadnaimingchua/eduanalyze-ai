'use client';

import Link from 'next/link';
import { ClipboardX } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { achievementStatus } from '@/lib/achievement-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CloAttentionCard({ courses }: Readonly<{ courses: InstructorCourseSummary[] }>) {
  const coursesWithGaps = courses
    .map((course) => ({ course, gaps: course.clos.filter((clo) => !clo.isAchieved) }))
    .filter((entry) => entry.gaps.length > 0);
  const totalGaps = coursesWithGaps.reduce((sum, entry) => sum + entry.gaps.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <ClipboardX className="h-4 w-4 text-amber-600" />
          CLO ที่ต้องดูแล
          {totalGaps > 0 && <Badge tone="danger">{totalGaps} รายการ</Badge>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          CLO ที่ผลสัมฤทธิ์ของวิชายังไม่ถึงเกณฑ์ที่ CLO นั้นตั้งไว้ รวมทุกวิชาที่คุณสอน
        </p>
      </CardHeader>
      <CardContent>
        {coursesWithGaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มี CLO ที่ต้องดูแลในขณะนี้</p>
        ) : (
          <div className="space-y-4">
            {coursesWithGaps.map(({ course, gaps }) => (
              <div key={course.courseId} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <Link
                    href={`/instructor/courses/${course.courseId}?tab=clo`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {course.code} {course.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    ผลสัมฤทธิ์วิชานี้ {Math.round(course.achievementPercent)}%
                  </span>
                </div>
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {gaps.map((clo) => {
                    const status = achievementStatus(course.achievementPercent, clo.threshold);
                    return (
                      <li
                        key={clo.cloId}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="text-muted-foreground">{clo.code}</span>{' '}
                          <span className="text-primary">{clo.description}</span>
                        </span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
