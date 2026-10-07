import type { RiskLevel } from '@eduanalyze-ai/shared-types';
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
