'use client';

import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { InstructorCourseCard } from './instructor-course-card';

export function InstructorCourseGrid({
  courses,
  selectedCourseId,
  onSelect,
}: {
  courses: InstructorCourseSummary[];
  selectedCourseId: string | null;
  onSelect: (courseId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, i) => (
        <div
          key={course.courseId}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'both' }}
        >
          <InstructorCourseCard
            course={course}
            selected={course.courseId === selectedCourseId}
            onSelect={() => onSelect(course.courseId)}
          />
        </div>
      ))}
    </div>
  );
}
