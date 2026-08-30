import { Prisma } from '@prisma/client';
import { AchievementResult, CoverageInfo, noEvidenceResult, zeroCoverage } from './types';

// One CLO's contribution toward one PLO — the CLO's own actual
// achievement (already computed by calculateActualCloAchievement),
// weighted by CloPloMapping.weight (a DIFFERENT weight from
// AssessmentCloMapping.weight used one level down — never conflate the
// two, per the Architecture Proposal).
export interface CloContribution {
  cloId: string;
  actualCloScore: Prisma.Decimal | null; // null = that CLO itself was NO_EVIDENCE
  cloPloWeight: Prisma.Decimal;
}

// actualPlo = SUM(actualClo * CloPloMapping.weight) / SUM(weights of CLOs that have valid evidence)
//
// A CLO with actualCloScore === null contributes nothing and is excluded
// from the denominator entirely — it never enters as a 0, same
// null-means-absent discipline as the CLO-level calculation one level
// down. No CLOs mapped at all, or every mapped CLO has no evidence ->
// score: null, status: NO_EVIDENCE.
export function calculateActualPloAchievement(contributions: CloContribution[]): AchievementResult {
  const totalCount = contributions.length;
  if (totalCount === 0) {
    return noEvidenceResult(zeroCoverage());
  }

  let weightedSum = new Prisma.Decimal(0);
  let usedWeight = new Prisma.Decimal(0);
  let totalWeight = new Prisma.Decimal(0);
  let validCount = 0;

  for (const c of contributions) {
    totalWeight = totalWeight.plus(c.cloPloWeight);

    if (c.actualCloScore === null) {
      continue;
    }
    weightedSum = weightedSum.plus(c.actualCloScore.times(c.cloPloWeight));
    usedWeight = usedWeight.plus(c.cloPloWeight);
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
