import type { Grade } from '@eduanalyze-ai/shared-types';
import { GRADE_ORDER, dataLevelOf, type DataLevel } from './course-snapshot';
import { GRADE_LABELS } from './grade-label';
import { GRADE_POINTS } from './instructor-overview';

// What the grades of one course say about it, with no goal to judge them by:
// the grade seen most, the middle grade and the course GPA. Reads a grade tally
// (gradeDistribution) only. W, I, S and U are left out, the same as the GPA rule
// everywhere else, so "people" here means people with a grade from A to F.
//
// How much to say follows the people: under 5 only the tally may be shown (no
// centre, no GPA); 5 to 9 is shown with a "few people" tag; 10 or more as is.

const LOW_TO_HIGH: readonly Grade[] = [...GRADE_ORDER].reverse();

// Grade points in half points, so every comparison below is integer arithmetic.
const HALF_POINTS = Object.fromEntries(
  GRADE_ORDER.map((g) => [g, (GRADE_POINTS[g] as number) * 2]),
) as Record<Grade, number>;

export interface GradeCenterValues {
  // The grades seen most often, best first; more than one when they tie.
  modes: Grade[];
  // The middle grade; low and high differ when the two middle people differ.
  median: { low: Grade; high: Grade };
  // Mean of the grade points, unrounded.
  gpa: number;
  // The grade closest to the GPA; exactly halfway goes to the lower grade.
  nearest: Grade;
  highest: Grade;
  lowest: Grade;
  // Spread of the grade points over the whole group (population, not sample).
  stdDev: number;
}

export interface GradeCenter {
  // People with a grade from A to F.
  people: number;
  level: DataLevel;
  // null under 5 people (and for nobody): show the tally only.
  values: GradeCenterValues | null;
}

const clean = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;

export function summarizeGradeCenter(distribution: Partial<Record<Grade, number>>): GradeCenter {
  const counts = Object.fromEntries(GRADE_ORDER.map((g) => [g, clean(distribution[g])])) as Record<
    Grade,
    number
  >;
  const people = GRADE_ORDER.reduce((sum, g) => sum + counts[g], 0);
  const level = dataLevelOf(people);
  if (level === 'insufficient') return { people, level, values: null };

  const mostSeen = Math.max(...GRADE_ORDER.map((g) => counts[g]));
  const modes = GRADE_ORDER.filter((g) => counts[g] === mostSeen);

  // The grade at a place in the line-up from the lowest grade to the highest.
  const gradeAt = (place: number): Grade => {
    let passed = 0;
    for (const g of LOW_TO_HIGH) {
      passed += counts[g];
      if (place < passed) return g;
    }
    return LOW_TO_HIGH[LOW_TO_HIGH.length - 1];
  };
  const median = {
    low: gradeAt(Math.floor((people - 1) / 2)),
    high: gradeAt(Math.ceil((people - 1) / 2)),
  };

  const halfSum = GRADE_ORDER.reduce((sum, g) => sum + counts[g] * HALF_POINTS[g], 0);
  const gpa = halfSum / 2 / people;
  // Lowest grade first and a strict "closer", so a tie keeps the lower grade.
  let nearest = LOW_TO_HIGH[0];
  let nearestGap = Infinity;
  for (const g of LOW_TO_HIGH) {
    const gap = Math.abs(halfSum - HALF_POINTS[g] * people);
    if (gap < nearestGap) {
      nearest = g;
      nearestGap = gap;
    }
  }

  const present = GRADE_ORDER.filter((g) => counts[g] > 0);
  const variance =
    GRADE_ORDER.reduce((sum, g) => sum + counts[g] * ((GRADE_POINTS[g] as number) - gpa) ** 2, 0) /
    people;

  return {
    people,
    level,
    values: {
      modes,
      median,
      gpa,
      nearest,
      highest: present[0],
      lowest: present[present.length - 1],
      stdDev: Math.sqrt(variance),
    },
  };
}

// ---- words ----

export const gradeText = (g: Grade): string => GRADE_LABELS[g];

// "B+", "B+ และ B", "A, B+ และ B".
export function formatGradeList(grades: readonly Grade[]): string {
  const labels = grades.map(gradeText);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} และ ${labels[labels.length - 1]}`;
}

// One grade, or "B ถึง B+" when the two middle people have different grades.
export function formatMedian(median: GradeCenterValues['median']): string {
  return median.low === median.high
    ? gradeText(median.low)
    : `${gradeText(median.low)} ถึง ${gradeText(median.high)}`;
}

export const formatCourseGpa = (gpa: number): string => gpa.toFixed(2);

// "เกรดที่พบมากที่สุด B+ · เกรดกลาง B · GPA วิชา 2.84"; null when there are too
// few people to say it.
export function centerLine(center: GradeCenter): string | null {
  if (!center.values) return null;
  const { modes, median, gpa } = center.values;
  return `เกรดที่พบมากที่สุด ${formatGradeList(modes)} · เกรดกลาง ${formatMedian(median)} · GPA วิชา ${formatCourseGpa(gpa)}`;
}
