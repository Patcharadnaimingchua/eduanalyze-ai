'use client';

import Link from 'next/link';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { achievementStatus } from '@/lib/achievement-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function InstructorCourseCard({ course }: { course: InstructorCourseSummary }) {
  const status = achievementStatus(course.achievementPercent, course.achievementThreshold);

  return (
    <Link href={`/instructor/courses/${course.courseId}`} className="block w-full text-left">
      <Card className="transition hover:ring-2 hover:ring-brand">
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
              <p className="truncate font-medium text-primary">{course.name}</p>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{course.studentCount} นักศึกษา</p>
            {course.atRiskStudents.length > 0 && (
              <Badge tone="danger">เสี่ยง {course.atRiskStudents.length}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
