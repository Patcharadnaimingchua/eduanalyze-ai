import { Grade } from '@prisma/client';

export interface CourseSummary {
  courseId: string;
  code: string;
  name: string;
  credits: number;
  grade?: Grade;
}

export interface CategoryProgress {
  categoryId: string;
  name: string;
  minCredits: number;
  minCourses: number | null;
  creditsEarned: number;
  coursesPassedCount: number;
  isComplete: boolean;
}

export interface GraduationReadiness {
  isReady: boolean;
  creditsMet: boolean;
  allCategoriesMet: boolean;
  missingRequiredCount: number;
}

export interface CreditCheckReport {
  studentProfileId: string;
  curriculumId: string;
  totalCreditsRequired: number;
  creditsStudied: number;
  creditsPassed: number;
  // Alias of creditsPassed — PROJECT_CONTEXT.md §18 names "หน่วยกิตสะสม"
  // (cumulative credits) as a separate checklist item, but it's the same
  // running total as passed credits in standard Thai transcript
  // terminology, not a different computation. Exposed explicitly so a
  // consumer searching for "cumulative" doesn't have to know it's spelled
  // creditsPassed here.
  creditsAccumulated: number;
  creditsRemaining: number;
  passedCourses: CourseSummary[];
  failedCourses: CourseSummary[];
  // Includes courses with no record at all AND courses whose latest
  // attempt graded W/I (EXCLUDED) — see grade-point.constant.ts.
  notYetStudiedCourses: CourseSummary[];
  missingRequiredCourses: (CourseSummary & { isPrerequisiteSatisfied: boolean })[];
  categoryProgress: CategoryProgress[];
  graduationReadiness: GraduationReadiness;
}
