import { Prisma } from '@prisma/client';

// Mirrors the DB enums (AssessmentScoreStatus/MissingScorePolicy) as
// plain string unions so these pure functions never import Prisma's
// generated enum objects — keeps this file (and its tests) free of any
// Prisma Client dependency beyond the Decimal type itself.
export type EvidenceStatus = 'PENDING' | 'GRADED' | 'ABSENT' | 'EXCUSED';
export type MissingScorePolicy = 'EXCLUDE' | 'TREAT_AS_ZERO';

// Where a computed achievement value came from — surfaced in every API
// response so a caller can never mistake a legacy estimate for real
// evidence. LEGACY_GRADE_ESTIMATE is reserved for a future phase; Phase 1
// never produces it (see assessment-evidence module's schema comment and
// TODO.md) — computing without real AssessmentDefinition/
// StudentAssessmentScore rows always resolves to NO_EVIDENCE, never a
// silent grade-based fallback.
export type EvidenceSource = 'EVIDENCE_BASED' | 'LEGACY_GRADE_ESTIMATE' | 'NO_EVIDENCE';

export type AchievementStatus = 'NO_EVIDENCE' | 'PARTIAL' | 'COMPLETE';

export interface CoverageInfo {
  // Item/CLO count actually used in the calculation (GRADED, or ABSENT
  // under TREAT_AS_ZERO) vs. every item/CLO considered (including
  // PENDING/EXCUSED/EXCLUDE-policy ABSENT ones, which reduce coverage
  // without being errors).
  validCount: number;
  totalCount: number;
  validWeight: Prisma.Decimal;
  totalWeight: Prisma.Decimal;
}

export interface AchievementResult {
  // 0-100 percent, or null when there is no usable evidence at all —
  // NEVER 0 as a stand-in for "no evidence" (that would be
  // indistinguishable from a real zero score).
  score: Prisma.Decimal | null;
  status: AchievementStatus;
  source: EvidenceSource;
  coverage: CoverageInfo;
}

export function zeroCoverage(totalCount = 0, totalWeight = new Prisma.Decimal(0)): CoverageInfo {
  return {
    validCount: 0,
    totalCount,
    validWeight: new Prisma.Decimal(0),
    totalWeight,
  };
}

export function noEvidenceResult(coverage: CoverageInfo): AchievementResult {
  return { score: null, status: 'NO_EVIDENCE', source: 'NO_EVIDENCE', coverage };
}
