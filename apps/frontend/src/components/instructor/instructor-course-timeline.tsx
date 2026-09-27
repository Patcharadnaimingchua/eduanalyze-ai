import Link from 'next/link';
import type { InstructorCourseTimelineYear } from '@eduanalyze-ai/shared-types';
import { formatSemesterLabel } from '@/lib/grade-label';
import { PageSection } from '@/components/layout/page-section';

// Mirrors YEAR_LEVEL_LABELS in dashboard.service.ts — bucket 4 absorbs
// anyone admitted more than 4 years before the group's own academic year.
const YEAR_LEVEL_LABELS: Record<number, string> = {
  1: 'ปี 1',
  2: 'ปี 2',
  3: 'ปี 3',
  4: 'ปี 4 ขึ้นไป',
};

// Deliberately not an accordion like YearLevelOverview — that pattern
// fits fixed-size buckets whose detail is a long student list worth
// hiding by default. Here the innermost level is a single short line per
// course, so everything renders expanded: an instructor should see their
// whole teaching schedule at a glance.
export function InstructorCourseTimeline({
  years,
}: Readonly<{ years: InstructorCourseTimelineYear[] }>) {
  return (
    <div className="space-y-8">
      {years.map((yearGroup) => (
        <PageSection key={yearGroup.academicYear} title={`ปีการศึกษา ${yearGroup.academicYear}`}>
          <div className="space-y-6">
            {yearGroup.semesters.map((semesterGroup) => (
              <div key={semesterGroup.semesterId} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {formatSemesterLabel(semesterGroup.semesterTerm, undefined)}
                </h3>
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {semesterGroup.courses.map((course) => (
                    <li
                      key={course.courseId}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <Link href={`/instructor/courses/${course.courseId}`} className="min-w-0">
                        <span className="text-muted-foreground">{course.code}</span>{' '}
                        <span className="text-primary hover:underline">{course.name}</span>{' '}
                        <span className="text-xs text-muted-foreground">
                          ({course.programCode} ฉบับ {course.curriculumYear})
                        </span>
                      </Link>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{course.studentCount} นักศึกษา</span>
                        <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand">
                          ส่วนใหญ่ {YEAR_LEVEL_LABELS[course.predominantYearLevel]}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PageSection>
      ))}
    </div>
  );
}
