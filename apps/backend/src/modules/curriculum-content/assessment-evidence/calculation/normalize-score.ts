import { Prisma } from '@prisma/client';

// score / effectiveMax * 100 — Decimal throughout, never coerced to a JS
// number mid-calculation (that's exactly the float-precision loss the
// Architecture Proposal's Decimal-safe requirement exists to avoid).
// effectiveMax must be > 0 (a 0-point assessment is a data-entry error,
// not a valid "always 100%" or "always 0%" case) — callers are expected
// to validate maxScore/maxScoreOverride at the DTO layer (§DTO min 0.01)
// so this should never actually throw in production; it throws rather
// than silently dividing by zero.
export function normalizeScore(
  score: Prisma.Decimal,
  effectiveMax: Prisma.Decimal,
): Prisma.Decimal {
  if (effectiveMax.lessThanOrEqualTo(0)) {
    throw new Error('normalizeScore: effectiveMax must be greater than 0');
  }
  return score.dividedBy(effectiveMax).times(100);
}

// AssessmentCloMapping.maxScoreOverride ?? AssessmentDefinition.maxScore
export function resolveEffectiveMax(
  maxScoreOverride: Prisma.Decimal | null,
  assessmentMaxScore: Prisma.Decimal,
): Prisma.Decimal {
  return maxScoreOverride ?? assessmentMaxScore;
}
