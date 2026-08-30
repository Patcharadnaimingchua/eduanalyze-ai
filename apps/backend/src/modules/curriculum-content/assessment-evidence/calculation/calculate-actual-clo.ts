import { Prisma } from '@prisma/client';
import { normalizeScore, resolveEffectiveMax } from './normalize-score';
import {
  AchievementResult,
  CoverageInfo,
  EvidenceStatus,
  MissingScorePolicy,
  noEvidenceResult,
  zeroCoverage,
} from './types';

// One row of evidence toward one CLO for one student's one course
// attempt (StudentCourseRecord) — i.e. one StudentAssessmentScore joined
// with its AssessmentCloMapping/AssessmentDefinition. Plain data, no
// Prisma model dependency, so this stays a pure function testable
// without a database.
export interface CloEvidenceItem {
  score: Prisma.Decimal | null;
  status: EvidenceStatus;
  weight: Prisma.Decimal; // AssessmentCloMapping.weight — assessment's weight toward THIS CLO, never CloPloMapping.weight
  maxScoreOverride: Prisma.Decimal | null;
  assessmentMaxScore: Prisma.Decimal;
  missingScorePolicy: MissingScorePolicy;
}

// actualClo = SUM(normalizedScore * weight) / SUM(valid evidence weights)
//
// - PENDING: excluded entirely (not yet graded, not evidence).
// - EXCUSED: excluded entirely, regardless of missingScorePolicy — an
//   excused item was never expected to produce a score.
// - ABSENT: policy-dependent —
//     EXCLUDE: excluded entirely, like PENDING/EXCUSED.
//     TREAT_AS_ZERO: normalizes to 0 and DOES count toward the
//     denominator (the student is being held accountable for a 0).
// - GRADED: normalizes score/effectiveMax, counts toward the denominator.
//
// No evidence rows at all, or every row excluded (weight sums to 0) ->
// score: null, status: NO_EVIDENCE. Never 0 — a 0 would be
// indistinguishable from "the student actually scored zero on
// everything," which is a different, real fact NO_EVIDENCE must not claim.
export function calculateActualCloAchievement(items: CloEvidenceItem[]): AchievementResult {
  const totalCount = items.length;
  if (totalCount === 0) {
    return noEvidenceResult(zeroCoverage());
  }

  let weightedSum = new Prisma.Decimal(0);
  let usedWeight = new Prisma.Decimal(0);
  let totalWeight = new Prisma.Decimal(0);
  let validCount = 0;

  for (const item of items) {
    totalWeight = totalWeight.plus(item.weight);

    if (item.status === 'PENDING' || item.status === 'EXCUSED') {
      continue;
    }

    if (item.status === 'ABSENT') {
      if (item.missingScorePolicy === 'EXCLUDE') {
        continue;
      }
      // TREAT_AS_ZERO: contributes a normalized 0, still counts toward
      // the denominator — deliberately not using normalizeScore(0, max)
      // to avoid a needless divide when the answer is always 0.
      usedWeight = usedWeight.plus(item.weight);
      validCount += 1;
      continue;
    }

    // GRADED — score should always be present by construction (the
    // service layer enforces score != null iff status === GRADED), but
    // guard defensively rather than let a bad row silently miscount.
    if (item.score === null) {
      continue;
    }
    const effectiveMax = resolveEffectiveMax(item.maxScoreOverride, item.assessmentMaxScore);
    const normalized = normalizeScore(item.score, effectiveMax);
    weightedSum = weightedSum.plus(normalized.times(item.weight));
    usedWeight = usedWeight.plus(item.weight);
    validCount += 1;
  }

  const coverage: CoverageInfo = { validCount, totalCount, validWeight: usedWeight, totalWeight };

  if (usedWeight.lessThanOrEqualTo(0)) {
    return noEvidenceResult(coverage);
  }

  const score = weightedSum.dividedBy(usedWeight);
  const status = validCount < totalCount ? 'PARTIAL' : 'COMPLETE';
  return { score, status, source: 'EVIDENCE_BASED', coverage };
}
