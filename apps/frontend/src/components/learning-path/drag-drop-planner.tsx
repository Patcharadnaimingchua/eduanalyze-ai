'use client';

import { useMemo, useRef, useState } from 'react';
import type { AvailableCourse } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseDragCard } from './course-drag-card';

type DropTarget = 'plan' | 'other';

export function DragDropPlanner({
  availableCourses,
  nextSemesterPlan,
  maxCreditsPerSemester,
}: Readonly<{
  availableCourses: AvailableCourse[];
  nextSemesterPlan: AvailableCourse[];
  maxCreditsPerSemester: number;
}>) {
  const courseById = useMemo(() => {
    const map = new Map<string, AvailableCourse>();
    for (const course of [...nextSemesterPlan, ...availableCourses]) {
      map.set(course.courseId, course);
    }
    return map;
  }, [nextSemesterPlan, availableCourses]);

  // Reset to the recommended plan is done by the page remounting this
  // component (new `key`), so the initial value is all that is needed here.
  const [planIds, setPlanIds] = useState<string[]>(() => nextSemesterPlan.map((c) => c.courseId));

  const planCourses = planIds.map((id) => courseById.get(id)).filter((c): c is AvailableCourse => !!c);
  const otherCourses = availableCourses.filter((c) => !planIds.includes(c.courseId));

  const totalCredits = planCourses.reduce((sum, c) => sum + c.credits, 0);
  const isOverLimit = totalCredits > maxCreditsPerSemester;

  // Which column is currently being dragged over, for the highlight
  // border/background below. A plain enter/leave state flickers because
  // dragenter/dragleave fire repeatedly as the pointer crosses child
  // elements (each CourseDragCard) inside the drop zone — the ref counter
  // tracks nesting depth per column so the highlight only clears once the
  // pointer has actually left the whole zone.
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const dragDepthRef = useRef<Record<DropTarget, number>>({ plan: 0, other: 0 });

  function moveToPlan(courseId: string) {
    setPlanIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
  }

  function moveToOthers(courseId: string) {
    setPlanIds((prev) => prev.filter((id) => id !== courseId));
  }

  function handleDragEnter(target: DropTarget) {
    dragDepthRef.current[target] += 1;
    setDragOverTarget(target);
  }

  function handleDragLeave(target: DropTarget) {
    dragDepthRef.current[target] = Math.max(0, dragDepthRef.current[target] - 1);
    if (dragDepthRef.current[target] === 0) {
      setDragOverTarget((prev) => (prev === target ? null : prev));
    }
  }

  function handleDrop(e: React.DragEvent, target: DropTarget) {
    e.preventDefault();
    dragDepthRef.current[target] = 0;
    setDragOverTarget(null);
    const courseId = e.dataTransfer.getData('text/plain');
    if (!courseId) return;
    if (target === 'plan') moveToPlan(courseId);
    else moveToOthers(courseId);
  }

  // The "other" column is usually much longer than the plan, so on desktop
  // the plan column sticks while scrolling — a course near the bottom of
  // the list can then be dragged straight onto it. Its own max height keeps
  // an over-full plan scrollable instead of running off-screen.
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CardTitle>วิชาในแผน ({planCourses.length})</CardTitle>
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                isOverLimit ? 'text-destructive' : 'text-emerald-700',
              )}
            >
              {totalCredits} / {maxCreditsPerSemester} หน่วยกิต
            </span>
          </div>
        </CardHeader>
        <CardContent
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => handleDragEnter('plan')}
          onDragLeave={() => handleDragLeave('plan')}
          onDrop={(e) => handleDrop(e, 'plan')}
          className={cn(
            'min-h-[120px] space-y-2 rounded-b-xl transition-colors lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto',
            dragOverTarget === 'plan' && 'bg-brand-light ring-2 ring-inset ring-brand',
          )}
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
          <CardTitle>วิชาที่ลงได้อื่นๆ ({otherCourses.length})</CardTitle>
        </CardHeader>
        <CardContent
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => handleDragEnter('other')}
          onDragLeave={() => handleDragLeave('other')}
          onDrop={(e) => handleDrop(e, 'other')}
          className={cn(
            'min-h-[120px] space-y-2 rounded-b-xl transition-colors',
            dragOverTarget === 'other' && 'bg-brand-light ring-2 ring-inset ring-brand',
          )}
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
  );
}
