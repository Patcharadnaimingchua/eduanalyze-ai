'use client';

import { useMemo, useState } from 'react';
import type { AvailableCourse } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseDragCard } from './course-drag-card';

export function DragDropPlanner({
  availableCourses,
  nextSemesterPlan,
  maxCreditsPerSemester,
}: {
  availableCourses: AvailableCourse[];
  nextSemesterPlan: AvailableCourse[];
  maxCreditsPerSemester: number;
}) {
  const courseById = useMemo(() => {
    const map = new Map<string, AvailableCourse>();
    for (const course of [...nextSemesterPlan, ...availableCourses]) {
      map.set(course.courseId, course);
    }
    return map;
  }, [nextSemesterPlan, availableCourses]);

  const recommendedPlanIds = useMemo(
    () => nextSemesterPlan.map((c) => c.courseId),
    [nextSemesterPlan],
  );

  const [planIds, setPlanIds] = useState<string[]>(recommendedPlanIds);

  const planCourses = planIds.map((id) => courseById.get(id)).filter((c): c is AvailableCourse => !!c);
  const otherCourses = availableCourses.filter((c) => !planIds.includes(c.courseId));

  const totalCredits = planCourses.reduce((sum, c) => sum + c.credits, 0);
  const isOverLimit = totalCredits > maxCreditsPerSemester;

  function moveToPlan(courseId: string) {
    setPlanIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
  }

  function moveToOthers(courseId: string) {
    setPlanIds((prev) => prev.filter((id) => id !== courseId));
  }

  function handleDrop(e: React.DragEvent, target: 'plan' | 'other') {
    e.preventDefault();
    const courseId = e.dataTransfer.getData('text/plain');
    if (!courseId) return;
    if (target === 'plan') moveToPlan(courseId);
    else moveToOthers(courseId);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">แผนการเรียนเทอมหน้า</CardTitle>
              <span className={cn('text-sm font-medium', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
                {totalCredits} / {maxCreditsPerSemester} หน่วยกิต
              </span>
            </div>
          </CardHeader>
          <CardContent
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'plan')}
            className="min-h-[120px] space-y-2 rounded-b-xl"
          >
            {isOverLimit && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-destructive">
                เกินหน่วยกิตสูงสุดต่อเทอม ({maxCreditsPerSemester} หน่วยกิต)
              </p>
            )}
            {planCourses.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">ลากวิชามาวางที่นี่</p>
            )}
            {planCourses.map((course) => (
              <CourseDragCard
                key={course.courseId}
                course={course}
                moveLabel="เอาออกจากแผน"
                onMove={() => moveToOthers(course.courseId)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">วิชาที่ลงได้อื่นๆ</CardTitle>
          </CardHeader>
          <CardContent
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'other')}
            className="min-h-[120px] space-y-2 rounded-b-xl"
          >
            {otherCourses.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">ไม่มีวิชาอื่นที่ลงได้ในขณะนี้</p>
            )}
            {otherCourses.map((course) => (
              <CourseDragCard
                key={course.courseId}
                course={course}
                moveLabel="ย้ายเข้าแผน"
                onMove={() => moveToPlan(course.courseId)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setPlanIds(recommendedPlanIds)}>
          รีเซ็ตเป็นแผนที่แนะนำ
        </Button>
      </div>
    </div>
  );
}
