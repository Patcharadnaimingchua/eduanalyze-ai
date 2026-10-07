'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CourseChoice {
  courseId: string;
  code: string;
  name: string;
  // Term and curriculum, only what the data has; both may be empty.
  meta: string;
}

// Which course the page is showing. A menu on phones (one tap, one hand, full
// names wrap onto more lines), a row of buttons from sm up. State stays with the
// caller (the dashboard keeps it in ?course=).
export function CourseSelector({
  courses,
  activeCourseId,
  onSelect,
}: Readonly<{
  courses: CourseChoice[];
  activeCourseId: string;
  onSelect: (courseId: string) => void;
}>) {
  if (courses.length < 2) return null;
  const active = courses.find((c) => c.courseId === activeCourseId);

  return (
    <>
      <details
        key={activeCourseId}
        className="group rounded-lg border border-slate-200 bg-card sm:hidden"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              เลือกวิชา ({courses.length}) · กดเพื่อสลับ
            </span>
            <span className="block break-words text-sm font-medium text-primary">
              {active ? `${active.code} ${active.name}` : 'เลือกวิชา'}
            </span>
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {courses.map((course) => {
            const isActive = course.courseId === activeCourseId;
            return (
              <li key={course.courseId}>
                <button
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSelect(course.courseId)}
                  className={cn(
                    'flex min-h-11 w-full flex-col items-start px-4 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'bg-brand-light font-medium text-brand' : 'text-slate-600 hover:text-brand',
                  )}
                >
                  <span className="break-words">
                    {course.code} {course.name}
                  </span>
                  {course.meta && <span className="text-xs text-muted-foreground">{course.meta}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </details>

      <div role="group" aria-label="เลือกวิชา" className="hidden flex-wrap gap-2 sm:flex">
        {courses.map((course) => {
          const isActive = course.courseId === activeCourseId;
          return (
            <button
              key={course.courseId}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(course.courseId)}
              className={cn(
                'flex min-h-11 max-w-full flex-col items-start rounded-xl border px-4 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-brand bg-brand-light font-medium text-brand'
                  : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand',
              )}
            >
              <span className="break-words">
                {course.code} {course.name}
              </span>
              {course.meta && <span className="text-xs font-normal text-muted-foreground">{course.meta}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}
