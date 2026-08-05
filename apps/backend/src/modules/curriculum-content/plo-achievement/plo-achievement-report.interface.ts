export interface RadarPoint {
  ploId: string;
  code: string;
  name: string;
  // null = no relevant CLO data yet for this student (never assessed) —
  // must stay distinguishable from 0 (assessed and scored zero).
  value: number | null;
}

export interface StudentPloAchievementReport {
  studentProfileId: string;
  curriculumId: string;
  radar: RadarPoint[];
  // Convenience derived fields — rank-based top/bottom-2 of PLOs with
  // non-null data only, never overlapping. The `radar` array above is the
  // source of truth; these are just a UI shortcut (PROJECT_CONTEXT.md §25:
  // AI/frontend interprets already-computed numbers, doesn't invent them).
  strengths: RadarPoint[];
  areasForImprovement: RadarPoint[];
}

export interface CoursePloEntry {
  ploId: string;
  code: string;
  name: string;
  achievementPercent: number;
  cloBreakdown: { cloId: string; code: string; weight: number }[];
}

export interface CoursePloAchievementReport {
  courseId: string;
  // Pass-through from Phase 8's course-level %.
  achievementPercent: number;
  plos: CoursePloEntry[];
}

export interface CohortPloAchievementReport {
  curriculumId: string;
  admissionYear: number;
  studentCount: number;
  // null = zero students in the cohort have any graded record — never 0.
  averageGpa: number | null;
  // Students contributing to averageGpa (excludes null-GPA students).
  gpaSampleSize: number;
  // Averaged per PLO, null if zero students have data for that PLO.
  radar: RadarPoint[];
  strengths: RadarPoint[];
  areasForImprovement: RadarPoint[];
}
