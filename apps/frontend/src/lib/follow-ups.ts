import type { InstructorCourseSummary, RiskLevel } from '@eduanalyze-ai/shared-types';

export interface FollowUpCount {
  total: number;
  critical: number;
  watch: number;
}

// People, not rows: a student at risk in two of the instructor's courses is one
// person to follow up, counted at their worst level. The level itself comes
// from the backend's riskLevel() (latest attempt per course); nothing here
// re-derives it from grades.
export function countFollowUps(
  courses: readonly Pick<InstructorCourseSummary, 'atRiskStudents'>[],
): FollowUpCount {
  const worst = new Map<string, Exclude<RiskLevel, 'NORMAL'>>();
  for (const course of courses) {
    for (const student of course.atRiskStudents) {
      if (student.riskLevel === 'NORMAL') continue;
      if (worst.get(student.studentProfileId) !== 'CRITICAL') {
        worst.set(student.studentProfileId, student.riskLevel);
      }
    }
  }
  let critical = 0;
  for (const level of worst.values()) if (level === 'CRITICAL') critical += 1;
  return { total: worst.size, critical, watch: worst.size - critical };
}
