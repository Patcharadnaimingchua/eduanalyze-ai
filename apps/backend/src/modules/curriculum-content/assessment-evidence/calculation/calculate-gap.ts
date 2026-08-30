import { Prisma } from '@prisma/client';

// Self-assessment (CourseAssessmentCloScore.score, integer 1-5) vs.
// evidence-based actual achievement (0-100%, converted to the same 1-5
// scale by dividing by 20 — mirrors apps/frontend/src/lib/five-scale.ts's
// percentToFiveScale, kept independent here since this is backend-only
// and must not import frontend code). A pure comparison for gap/insight
// display — the Architecture Proposal is explicit this must never feed
// back into the actual CLO/PLO calculation itself; nothing in
// calculate-actual-clo.ts/calculate-actual-plo.ts reads this value or
// self-assessment data at all.
//
// Either side missing (no self-assessment submitted, or actualCloPercent
// is null/NO_EVIDENCE) -> gap: null, never a guessed/defaulted number.
export function calculateGap(
  selfAssessmentScore: number | null,
  actualCloPercent: Prisma.Decimal | null,
): Prisma.Decimal | null {
  if (selfAssessmentScore === null || actualCloPercent === null) {
    return null;
  }
  const actualFiveScale = actualCloPercent.dividedBy(20);
  return new Prisma.Decimal(selfAssessmentScore).minus(actualFiveScale);
}
