import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { SPARSE_SUMMARY } from './course-snapshot';
import { countFollowUps } from './follow-ups';
import { centerLine, summarizeGradeCenter } from './grade-center';
import { emptyCounts, summarizeParts } from './instructor-overview';

// Pure, rule-based header line for /instructor/courses/[courseId]. Reads only
// the course's entry in GET /dashboard/instructor, so the figures match the
// same course's row on the dashboard and nothing extra is fetched.

export const NO_STUDENTS_IN_COURSE = 'ยังไม่มีนักศึกษาลงทะเบียนในวิชานี้';

// What the grades say (most common grade, middle grade, course GPA), then the
// people to follow up. The grade part is the same reading as the overview below
// (grade-center): no goal to measure it against; under 5 graded people it says
// the data is thin; 5 to 9 it says the sample is small.
export function buildCourseDetailSummary(
  course: Pick<InstructorCourseSummary, 'gradeDistribution' | 'atRiskStudents'>,
): string {
  const counts = { ...emptyCounts(), ...course.gradeDistribution };
  if (summarizeParts([{ counts, credits: null }]).seats === 0) return NO_STUDENTS_IN_COURSE;

  const center = summarizeGradeCenter(counts);
  const line = centerLine(center);
  const parts: string[] = [
    line === null ? SPARSE_SUMMARY : center.level === 'low' ? `${line} (ตัวอย่างน้อย)` : line,
  ];

  const followUps = countFollowUps([course]);
  parts.push(
    followUps.total > 0
      ? `ต้องติดตาม ${followUps.total} คน` +
          (followUps.critical > 0 ? ` (เร่งด่วน ${followUps.critical})` : '')
      : 'ยังไม่มีนักศึกษาที่ต้องติดตาม',
  );

  return parts.join(' · ');
}
