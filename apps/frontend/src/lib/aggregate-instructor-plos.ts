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

export interface PloCourseContribution {
  courseId: string;
  code: string;
  name: string;
  achievementPercent: number; // this course's own PLO achievement, not the weighted average above
  // CoursePloEntry has no PLO-specific threshold (a PLO's percent is a
  // weighted average of its constituent CLOs' pass rates, not a single
  // bar of its own) — the course's own achievementThreshold is the same
  // bar CloAttentionCard judges this course's CLOs against.
  achievementThreshold: number;
}

// Reverse-index of the same courses[].plos[] data aggregateInstructorPlos()
// reads — "which courses feed this PLO" instead of "one number per PLO".
// Sorted worst-first, matching CourseComparisonChart's convention.
export function coursesByPlo(
  courses: InstructorCourseSummary[],
): Map<string, PloCourseContribution[]> {
  const map = new Map<string, PloCourseContribution[]>();
  for (const course of courses) {
    for (const plo of course.plos) {
      const list = map.get(plo.ploId) ?? [];
      list.push({
        courseId: course.courseId,
        code: course.code,
        name: course.name,
        achievementPercent: plo.achievementPercent,
        achievementThreshold: course.achievementThreshold,
      });
      map.set(plo.ploId, list);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.achievementPercent - b.achievementPercent);
  }
  return map;
}
