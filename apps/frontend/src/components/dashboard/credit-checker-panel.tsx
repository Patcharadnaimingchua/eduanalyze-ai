import { AlertTriangle, BookOpen } from 'lucide-react';
import type { MissingRequiredCourse } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Real data — StudentDashboardReport.missingRequiredCourses (Smart
// Credit Checker, Phase 7, deterministic). The Figma copy said "ระบบ AI
// ได้วิเคราะห์..." but this isn't AI output at all — wording below
// doesn't claim that, to avoid misattributing deterministic Credit
// Checker logic to the AI module (which is a separate, unrelated
// endpoint — see ai-radar-placeholder.tsx).
export function CreditCheckerPanel({ courses }: { courses: MissingRequiredCourse[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ระบบตรวจสอบเครดิตอัจฉริยะ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {courses.length > 0 ? (
            <>
              เทียบผลการเรียนของคุณกับโครงสร้างหลักสูตรปัจจุบันแล้ว พบว่าคุณเหลืออีก{' '}
              <span className="font-medium text-primary">{courses.length} รายวิชา</span>{' '}
              ที่ยังไม่ผ่านตามเกณฑ์การสำเร็จการศึกษา
            </>
          ) : (
            'คุณผ่านรายวิชาบังคับครบตามเกณฑ์แล้ว'
          )}
        </p>

        <div className="space-y-2">
          {courses.slice(0, 3).map((course) => (
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
                <p className="text-xs text-muted-foreground">{course.credits} หน่วยกิต</p>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" className="w-full" disabled>
          ดูแผนเส้นทางทั้งหมด
        </Button>
      </CardContent>
    </Card>
  );
}
