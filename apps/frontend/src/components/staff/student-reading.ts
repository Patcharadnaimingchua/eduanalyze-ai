import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import type { SemanticTone } from '@/lib/tone';

// Display-layer readings of the numbers the Staff endpoints return. The
// band is decided backend-side from the cumulative GPA. The backend has no
// "no data" level — a student with no GPA comes back NORMAL with gpa null —
// so that case is told apart here and shown grey instead of reading as "ปกติ".

export type StaffRiskKey = RiskLevel | 'NO_DATA';

export interface StaffRiskReading {
  key: StaffRiskKey;
  label: string;
  tone: SemanticTone;
}

export const NO_DATA_LABEL = 'ยังไม่มีข้อมูล';

// No GPA (nothing graded that counts, e.g. only W/I/S/U) is "no data",
// whatever else the student has on record.
export function readStudentRisk(student: {
  riskLevel: RiskLevel;
  gpa: number | null;
}): StaffRiskReading {
  if (student.gpa === null) {
    return { key: 'NO_DATA', label: NO_DATA_LABEL, tone: 'neutral' };
  }
  return {
    key: student.riskLevel,
    label: RISK_LEVEL_LABELS[student.riskLevel],
    tone: RISK_LEVEL_TONES[student.riskLevel],
  };
}
