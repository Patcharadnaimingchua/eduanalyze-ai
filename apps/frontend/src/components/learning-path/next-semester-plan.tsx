import type { AvailableCourse } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NextSemesterPlan({
  courses,
  maxCreditsPerSemester,
}: {
  courses: AvailableCourse[];
  maxCreditsPerSemester: number;
}) {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">แผนการเรียนเทอมหน้า (แนะนำ)</CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalCredits} / {maxCreditsPerSemester} หน่วยกิต
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {courses.length === 0 && (
          <p className="text-center text-muted-foreground">ไม่มีวิชาแนะนำในขณะนี้</p>
        )}
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
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                course.isRequired ? 'bg-brand-light text-brand' : 'bg-slate-100 text-slate-600',
              )}
            >
              {course.isRequired ? 'วิชาบังคับ' : 'วิชาเลือก'}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
