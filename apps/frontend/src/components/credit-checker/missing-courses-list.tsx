import { AlertTriangle, BookOpen } from 'lucide-react';
import type { CourseSummary } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MissingCoursesList({
  courses,
}: {
  courses: (CourseSummary & { isPrerequisiteSatisfied: boolean })[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายวิชาบังคับที่ยังไม่ผ่าน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {courses.length === 0 && (
          <p className="text-center text-muted-foreground">คุณผ่านรายวิชาบังคับครบตามเกณฑ์แล้ว</p>
        )}
        {courses.map((course) => (
          <div
            key={course.courseId}
            className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
          >
            {course.isPrerequisiteSatisfied ? (
              <BookOpen size={18} className="mt-0.5 shrink-0 text-brand" />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium text-primary">
                {course.code}: {course.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {course.credits} หน่วยกิต
                {!course.isPrerequisiteSatisfied && ' — ยังไม่ผ่านวิชาที่ต้องเรียนก่อน'}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
