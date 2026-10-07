import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import { INSUFFICIENT_BELOW } from '@/lib/course-snapshot';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import type { SemanticTone } from '@/lib/tone';

// Display-layer readings of the numbers the Staff endpoints return. The
// backend has no "no data" risk level — a student with no graded record at
// all comes back NORMAL with no GPA — so that case is told apart here and
// shown grey instead of reading as "ปกติ".

export type StaffRiskKey = RiskLevel | 'NO_DATA';

export interface StaffRiskReading {
  key: StaffRiskKey;
  label: string;
  tone: SemanticTone;
}

export const NO_DATA_LABEL = 'ยังไม่มีข้อมูล';
export const FEW_GRADED_LABEL = 'ข้อมูลยังน้อย';

// Worst first, with "no data" last: it is not a better outcome than NORMAL,
// just an absence of one.
export const STAFF_RISK_ORDER: StaffRiskKey[] = ['CRITICAL', 'WATCH', 'NORMAL', 'NO_DATA'];

// A student with at-risk courses always has a grade, so only the NORMAL +
// no GPA + nothing at risk combination is "no data". A CRITICAL student
// whose only grade is U has no GPA but is not that.
export function readStudentRisk(student: {
  riskLevel: RiskLevel;
  gpa: number | null;
  atRiskCourseCount: number;
}): StaffRiskReading {
  if (student.riskLevel === 'NORMAL' && student.gpa === null && student.atRiskCourseCount === 0) {
    return { key: 'NO_DATA', label: NO_DATA_LABEL, tone: 'neutral' };
  }
  return {
    key: student.riskLevel,
    label: RISK_LEVEL_LABELS[student.riskLevel],
    tone: RISK_LEVEL_TONES[student.riskLevel],
  };
}

// How many active students in each curriculum have a GPA, i.e. the people
// the backend's averageGpa is actually averaged over.
export function countGradedByCurriculum(
  students: readonly { curriculumId: string; isActive: boolean; gpa: number | null }[],
): Map<string, number> {
  const graded = new Map<string, number>();
  for (const student of students) {
    if (!student.isActive || student.gpa === null) continue;
    graded.set(student.curriculumId, (graded.get(student.curriculumId) ?? 0) + 1);
  }
  return graded;
}

export type AverageGpaReading =
  | { kind: 'none'; text: string }
  | { kind: 'few'; text: string }
  | { kind: 'ok'; text: string };

// Same threshold as the instructor pages: under INSUFFICIENT_BELOW graded
// people the average is not shown, since it moves a lot with one student.
export function readAverageGpa(averageGpa: number | null, gradedCount: number): AverageGpaReading {
  if (averageGpa === null || gradedCount === 0) {
    return { kind: 'none', text: NO_DATA_LABEL };
  }
  if (gradedCount < INSUFFICIENT_BELOW) {
    return { kind: 'few', text: `${FEW_GRADED_LABEL} (มีเกรด ${gradedCount} คน)` };
  }
  return { kind: 'ok', text: `${averageGpa.toFixed(2)} · เฉลี่ยจาก ${gradedCount} คนที่มีเกรด` };
}
