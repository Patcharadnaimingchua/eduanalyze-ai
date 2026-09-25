'use client';

import Link from 'next/link';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';

// Pill style, deliberately distinct from InstructorDetailPanel's underline
// tabs — those switch panels within one course, this switches which course
// is loaded. Sharing one visual language would blur the two concepts.
// Preserves ?tab= across the switch so e.g. staying on "ผลลัพธ์การเรียนรู้"
// carries over to the next course.
export function CourseTabStrip({
  courses,
  activeCourseId,
  tabParam,
}: Readonly<{
  courses: InstructorCourseSummary[];
  activeCourseId: string;
  tabParam: string | null;
}>) {
  if (courses.length < 2) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {courses.map((course) => {
        const isActive = course.courseId === activeCourseId;
        return (
          <Link
            key={course.courseId}
            href={`/instructor/courses/${course.courseId}${tabParam ? `?tab=${tabParam}` : ''}`}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              isActive
                ? 'border-brand bg-brand-light text-brand'
                : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand',
            )}
          >
            {course.code}
          </Link>
        );
      })}
    </div>
  );
}
