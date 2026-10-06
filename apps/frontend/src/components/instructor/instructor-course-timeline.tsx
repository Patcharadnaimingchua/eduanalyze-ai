import Link from 'next/link';
import type { InstructorCourseTimelineSemester } from '@eduanalyze-ai/shared-types';
import { formatSemesterLabel } from '@/lib/grade-label';
import { yearLevelLabel } from '@/lib/course-timeline-summary';

// One term's courses as tappable rows (44px+). Course names wrap rather than
// being cut; the curriculum is a quieter second line.
export function TermCourseList({
  semester,
}: Readonly<{ semester: InstructorCourseTimelineSemester }>) {
  return (
    <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
      {semester.courses.map((course) => (
        <li key={course.courseId}>
          <Link
            href={`/instructor/courses/${course.courseId}`}
            className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block">
                <span className="text-muted-foreground">{course.code}</span>{' '}
                <span className="text-primary">{course.name}</span>
              </span>
              <span className="block text-xs text-muted-foreground">
                {course.programCode} ฉบับ {course.curriculumYear}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{course.studentCount} นักศึกษา</span>
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand">
                ส่วนใหญ่ {yearLevelLabel(course.predominantYearLevel)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TermHeading({ term }: Readonly<{ term: string }>) {
  return <h3 className="text-sm font-medium text-muted-foreground">{formatSemesterLabel(term, undefined)}</h3>;
}
