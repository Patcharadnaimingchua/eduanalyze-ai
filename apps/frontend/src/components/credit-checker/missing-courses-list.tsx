'use client';

import { useId, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import type { CourseSummary } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

type MissingCourse = CourseSummary & { isPrerequisiteSatisfied: boolean };

function tileIcon(course: MissingCourse, isFailed: boolean) {
  if (isFailed) return RotateCcw;
  return course.isPrerequisiteSatisfied ? BookOpen : AlertTriangle;
}

function CourseTile({ course, isFailed }: Readonly<{ course: MissingCourse; isFailed: boolean }>) {
  const Icon = tileIcon(course, isFailed);
  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
      <Icon
        size={18}
        aria-hidden="true"
        className={cn(
          'mt-0.5 shrink-0',
          course.isPrerequisiteSatisfied && !isFailed ? 'text-brand' : 'text-amber-500',
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary">
          {course.code}: {course.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {course.credits} หน่วยกิต
          {isFailed && ' · สอบตกแล้ว — ต้องลงทะเบียนใหม่'}
          {!isFailed && !course.isPrerequisiteSatisfied && ' · ยังไม่ผ่านวิชาที่ต้องเรียนก่อน'}
        </p>
      </div>
    </li>
  );
}

// Split by "can I register for this now?" — the locked group is reference
// until its prerequisites clear, so it starts collapsed unless it is all
// there is.
export function MissingCoursesList({
  courses,
  failedCourseIds,
}: Readonly<{
  courses: MissingCourse[];
  failedCourseIds?: ReadonlySet<string>;
}>) {
  const available = courses.filter((c) => c.isPrerequisiteSatisfied);
  const locked = courses.filter((c) => !c.isPrerequisiteSatisfied);
  const [showLocked, setShowLocked] = useState(available.length === 0);
  const lockedListId = useId();

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState icon={CheckCircle2} description="คุณผ่านรายวิชาบังคับครบตามเกณฑ์แล้ว" />
        </CardContent>
      </Card>
    );
  }

  const isFailed = (c: MissingCourse) => failedCourseIds?.has(c.courseId) ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายวิชาบังคับที่ยังไม่ผ่าน ({courses.length})</CardTitle>
        <CardDescription>
          ลงทะเบียนได้เลย {available.length} วิชา · ติดวิชาก่อนหน้า {locked.length} วิชา
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {available.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              ลงทะเบียนได้เลย ({available.length})
            </h4>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {available.map((course) => (
                <CourseTile key={course.courseId} course={course} isFailed={isFailed(course)} />
              ))}
            </ul>
          </div>
        )}

        {locked.length > 0 && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLocked((v) => !v)}
              aria-expanded={showLocked}
              aria-controls={lockedListId}
              className="-ml-3 h-auto gap-1.5 whitespace-normal py-1.5 text-left text-muted-foreground"
            >
              ติดวิชาก่อนหน้า — ยังลงไม่ได้ ({locked.length})
              <ChevronDown size={14} className={cn('transition-transform', showLocked && 'rotate-180')} />
            </Button>
            {showLocked && (
              <ul id={lockedListId} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {locked.map((course) => (
                  <CourseTile key={course.courseId} course={course} isFailed={isFailed(course)} />
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
