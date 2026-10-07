import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { isLowGrade } from './low-grade';

// People, not rows: a student with a low grade in two of the instructor's
// courses is one person. atRiskStudents holds each student's latest attempt of
// that course (grade C or below); only D+, D, F and U count here.
export function countLowGradePeople(
  courses: readonly Pick<InstructorCourseSummary, 'atRiskStudents'>[],
): number {
  const people = new Set<string>();
  for (const course of courses) {
    for (const student of course.atRiskStudents) {
      if (isLowGrade(student.grade)) people.add(student.studentProfileId);
    }
  }
  return people.size;
}
