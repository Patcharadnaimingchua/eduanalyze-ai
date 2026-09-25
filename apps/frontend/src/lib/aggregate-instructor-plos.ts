import type { InstructorCourseSummary, RadarPoint } from '@eduanalyze-ai/shared-types';

// Groups CoursePloEntry[] (per-course, already returned by
// GET /dashboard/instructor) by ploId across every course an instructor
// teaches, weighted by studentCount — same rationale as
// overallAchievementPercent() in the dashboard page: a 1-student course
// shouldn't count as much as a 60-student one. Keyed by ploId rather than
// code because Plo is scoped to a curriculum (schema.prisma), so two
// different curricula could coincidentally reuse the same PLO code.
export function aggregateInstructorPlos(courses: InstructorCourseSummary[]): RadarPoint[] {
  const byId = new Map<
    string,
    { code: string; name: string; weightedSum: number; totalStudents: number }
  >();

  for (const course of courses) {
    for (const plo of course.plos) {
      const entry = byId.get(plo.ploId) ?? {
        code: plo.code,
        name: plo.name,
        weightedSum: 0,
        totalStudents: 0,
      };
      entry.weightedSum += plo.achievementPercent * course.studentCount;
      entry.totalStudents += course.studentCount;
      byId.set(plo.ploId, entry);
    }
  }

  return [...byId.entries()]
    .map(([ploId, entry]) => ({
      ploId,
      code: entry.code,
      name: entry.name,
      value: entry.totalStudents > 0 ? entry.weightedSum / entry.totalStudents : null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}
