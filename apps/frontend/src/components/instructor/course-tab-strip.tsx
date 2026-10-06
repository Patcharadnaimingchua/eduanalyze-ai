'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';

// Pill style from sm up (a menu on phones), deliberately distinct from InstructorDetailPanel's underline
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

  const hrefFor = (course: InstructorCourseSummary) =>
    `/instructor/courses/${course.courseId}${tabParam ? `?tab=${tabParam}` : ''}`;
  const active = courses.find((c) => c.courseId === activeCourseId);

  return (
    <>
      {/* Phones: one bar that opens the list, so several courses do not take
          several rows. Plain links in a native <details>, so the tab in the
          URL is carried over and the unsaved-scores guard (which watches link
          clicks) covers it; keyed by course so it closes after a switch. */}
      <details
        key={activeCourseId}
        className="group rounded-lg border border-slate-200 bg-card sm:hidden"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              รายวิชาที่สอน ({courses.length}) · กดเพื่อสลับ
            </span>
            <span className="block text-sm font-medium text-primary">
              {active ? `${active.code} ${active.name}` : 'เลือกวิชา'}
            </span>
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <nav aria-label="สลับรายวิชา" className="border-t border-slate-100">
          <ul className="divide-y divide-slate-100">
            {courses.map((course) => {
              const isActive = course.courseId === activeCourseId;
              return (
                <li key={course.courseId}>
                  <Link
                    href={hrefFor(course)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive ? 'bg-brand-light font-medium text-brand' : 'text-slate-600 hover:text-brand',
                    )}
                  >
                    {course.code} {course.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </details>

      <nav aria-label="สลับรายวิชา" className="hidden flex-wrap gap-2 sm:flex">
        {courses.map((course) => {
          const isActive = course.courseId === activeCourseId;
          return (
            <Link
              key={course.courseId}
              href={hrefFor(course)}
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
    </>
  );
}
