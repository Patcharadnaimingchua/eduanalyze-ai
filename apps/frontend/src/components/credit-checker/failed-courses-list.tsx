import type { CourseSummary } from '@eduanalyze-ai/shared-types';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS } from '@/lib/grade-label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FailedCoursesList({ courses }: Readonly<{ courses: CourseSummary[] }>) {
  if (courses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>วิชาที่สอบตก (ต้องลงทะเบียนใหม่)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {courses.map((course) => (
          <div
            key={course.courseId}
            className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
          >
            <div>
              <p className="text-sm font-medium text-primary">
                {course.code}: {course.name}
              </p>
              <p className="text-xs text-muted-foreground">{course.credits} หน่วยกิต</p>
            </div>
            <Badge tone={course.grade ? gradeBadgeTone(course.grade) : 'warning'}>
              {course.grade ? GRADE_LABELS[course.grade] : '—'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
