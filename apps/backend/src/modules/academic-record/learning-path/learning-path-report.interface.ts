import { CourseSummary, CreditCheckReport } from '../credit-checker/credit-checker-report.interface';

// isRequired now lives on CourseSummary itself (added for the Prerequisite
// Flow Chart) — AvailableCourse no longer needs to re-declare it.
export type AvailableCourse = CourseSummary;

export interface IncompleteElectiveCategory {
  categoryId: string;
  name: string;
  creditsEarned: number;
  minCredits: number;
  creditsShort: number;
  // Subset of availableCourses (elective, prerequisite-satisfied) that
  // belong to this category — candidates to close the gap.
  availableElectivesInCategory: CourseSummary[];
}

export interface LearningPathReport {
  studentProfileId: string;
  curriculumId: string;
  // Courses the student hasn't passed yet (never taken, or failed and
  // retakeable per the confirmed retake policy) with every prerequisite
  // already passed — the "ready to take now" list (PROJECT_CONTEXT.md
  // §28's Semester Planning, scoped to "what's available right now", not
  // a multi-semester pacing projection).
  availableCourses: AvailableCourse[];
  // Pass-through from CreditCheckReport — never recomputed at a second
  // call site (CONVENTIONS.md §6).
  missingRequiredCourses: CreditCheckReport['missingRequiredCourses'];
  incompleteElectiveCategories: IncompleteElectiveCategory[];
  graduationReadiness: CreditCheckReport['graduationReadiness'];
  // One-semester-ahead recommendation only (§28's Semester Planning) —
  // greedy required-then-elective selection capped at the curriculum's
  // maxCreditsPerSemester. No multi-semester roadmap — no pacing model
  // exists anywhere in this schema to project one from.
  nextSemesterPlan: AvailableCourse[];
}
