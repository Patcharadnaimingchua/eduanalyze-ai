import { SemesterTerm } from '@prisma/client';
import { SEMESTER_TERM_RANK } from './grade-point.constant';

export interface GpaTrendPoint {
  academicYear: number;
  semesterTerm: SemesterTerm;
  gpa: number;
  creditsCounted: number;
}

interface SemesterGpaLike {
  academicYear: number;
  semesterTerm: SemesterTerm;
  gpa: number | null;
  creditsCounted: number;
}

// Chronological per-semester GPA series for the dashboard sparkline.
// Semesters without a GPA (every course W/I/S/U) are dropped rather than
// plotted as 0 — "no graded credits" is not the same as a 0.00 GPA.
// Input order is not trusted: SemesterGpa comes from a Map over an unordered
// query, so sorting here is what makes the series chronological.
export function buildGpaTrend(bySemester: readonly SemesterGpaLike[]): GpaTrendPoint[] {
  return bySemester
    .filter((s): s is SemesterGpaLike & { gpa: number } => s.gpa !== null)
    .map((s) => ({
      academicYear: s.academicYear,
      semesterTerm: s.semesterTerm,
      gpa: s.gpa,
      creditsCounted: s.creditsCounted,
    }))
    .sort(
      (a, b) =>
        a.academicYear - b.academicYear ||
        SEMESTER_TERM_RANK[a.semesterTerm] - SEMESTER_TERM_RANK[b.semesterTerm],
    );
}
