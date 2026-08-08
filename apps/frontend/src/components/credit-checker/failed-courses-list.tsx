import type { CourseSummary } from '@eduanalyze-ai/shared-types';
import { GRADE_LABELS } from '@/lib/grade-label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FailedCoursesList({ courses }: { courses: CourseSummary[] }) {
  if (courses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">วิชาที่สอบตก (ต้องลงทะเบียนใหม่)</CardTitle>
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
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
              {course.grade ? GRADE_LABELS[course.grade] : '—'}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
