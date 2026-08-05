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
