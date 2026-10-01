import type { AssessmentCloMapping, AssessmentScoreStatus } from '@eduanalyze-ai/shared-types';

// Decimal fields arrive as strings; parse only here at the boundary.
export function effectiveMaxOf(
  mapping: Pick<AssessmentCloMapping, 'maxScoreOverride'>,
  definitionMaxScore: string | number,
): number {
  return Number(mapping.maxScoreOverride ?? definitionMaxScore);
}

// A raw score is normalized against each mapping's own maximum, so the same
// number only means the same thing on mappings that share that maximum.
export function isCompatibleMax(candidateMax: number, currentMax: number): boolean {
  return candidateMax === currentMax;
}

export interface ScoreRowInput {
  studentCode: string;
  status: AssessmentScoreStatus;
  score: string;
}

// Friendly pre-flight for the rows about to be sent, so the instructor sees a
// student code rather than a record id. The backend enforces the same rules
// and remains the guarantee.
export function findScoreRowProblems(rows: ScoreRowInput[], maxScore: number | null): string[] {
  const problems: string[] = [];
  for (const row of rows) {
    if (row.status !== 'GRADED') continue;
    if (row.score === '') {
      problems.push(`${row.studentCode}: สถานะ "ตรวจแล้ว" ต้องกรอกคะแนน`);
      continue;
    }
    const value = Number(row.score);
    if (Number.isNaN(value) || value < 0) {
      problems.push(`${row.studentCode}: คะแนนไม่ถูกต้อง`);
    } else if (maxScore !== null && value > maxScore) {
      problems.push(`${row.studentCode}: คะแนน ${value} เกินคะแนนเต็ม ${maxScore}`);
    }
  }
  return problems;
}
