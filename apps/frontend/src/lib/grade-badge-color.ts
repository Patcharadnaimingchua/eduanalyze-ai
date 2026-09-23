import type { Grade } from '@eduanalyze-ai/shared-types';
import { BADGE_TONE_CLASSES, type SemanticTone } from '@/lib/tone';

// Mirrors the PASS/FAIL/EXCLUDED split already defined backend-side
// (grade-point.constant.ts's GRADE_STATUS) rather than inventing a new
// categorization — S is PASS (success, credit-earning even though it has
// no GPA effect) and U is FAIL (danger, same severity as F), W/I are
// EXCLUDED (neutral). A/B_PLUS/B vs C_PLUS-D further split PASS into
// "solid" vs "risky" for the badge, which GRADE_STATUS itself doesn't
// distinguish (both are just PASS there).
const GRADE_BADGE_TONE: Record<Grade, SemanticTone> = {
  A: 'success',
  B_PLUS: 'success',
  B: 'success',
  C_PLUS: 'warning',
  C: 'warning',
  D_PLUS: 'warning',
  D: 'warning',
  S: 'success',
  F: 'danger',
  U: 'danger',
  W: 'neutral',
  I: 'neutral',
};

export function gradeBadgeTone(grade: Grade): SemanticTone {
  return GRADE_BADGE_TONE[grade];
}

export function gradeBadgeClassName(grade: Grade): string {
  return BADGE_TONE_CLASSES[gradeBadgeTone(grade)];
}
