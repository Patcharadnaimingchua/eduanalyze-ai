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
    <nav aria-label="สลับรายวิชา" className="flex flex-wrap gap-2">
      {courses.map((course) => {
        const isActive = course.courseId === activeCourseId;
        return (
          <Link
            key={course.courseId}
            href={`/instructor/courses/${course.courseId}${tabParam ? `?tab=${tabParam}` : ''}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 max-w-full items-center rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-brand bg-brand-light text-brand'
                : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand',
            )}
          >
            <span className="min-w-0">
              {course.code} {course.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
