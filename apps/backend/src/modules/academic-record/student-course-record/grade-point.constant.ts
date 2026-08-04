import { Grade, SemesterTerm } from '@prisma/client';

// Thai national grade-point scale. null = does not affect GPA (excluded
// from both numerator and denominator) — W (withdrawn), I (incomplete),
// S/U (satisfactory/unsatisfactory, non-credit-bearing-for-GPA courses
// like Cooperative Education).
export const GRADE_POINTS: Record<Grade, number | null> = {
  A: 4.0,
  B_PLUS: 3.5,
  B: 3.0,
  C_PLUS: 2.5,
  C: 2.0,
  D_PLUS: 1.5,
  D: 1.0,
  F: 0.0,
  W: null,
  I: null,
  S: null,
  U: null,
};

// Chronological order within a Thai academic year (1st sem ~Aug-Dec,
// 2nd sem ~Jan-May, Summer ~Jun-Jul) — used to resolve "latest attempt"
// when a student retakes a course.
export const SEMESTER_TERM_RANK: Record<SemesterTerm, number> = {
  FIRST: 1,
  SECOND: 2,
  SUMMER: 3,
};
