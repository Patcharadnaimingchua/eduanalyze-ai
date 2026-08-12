import type { Grade } from '@eduanalyze-ai/shared-types';

export type GradeBadgeTone = 'green' | 'amber' | 'red' | 'gray';

// Mirrors the PASS/FAIL/EXCLUDED split already defined backend-side
// (grade-point.constant.ts's GRADE_STATUS) rather than inventing a new
// categorization — S is PASS (green, credit-earning even though it has
// no GPA effect) and U is FAIL (red, same severity as F), W/I are
// EXCLUDED (gray, neutral). A/B_PLUS/B vs C_PLUS-D further split PASS
// into "solid" vs "risky" for the badge, which GRADE_STATUS itself
// doesn't distinguish (both are just PASS there).
const GRADE_BADGE_TONE: Record<Grade, GradeBadgeTone> = {
  A: 'green',
  B_PLUS: 'green',
  B: 'green',
  C_PLUS: 'amber',
  C: 'amber',
  D_PLUS: 'amber',
  D: 'amber',
  S: 'green',
  F: 'red',
  U: 'red',
  W: 'gray',
  I: 'gray',
};

const TONE_CLASSES: Record<GradeBadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function gradeBadgeTone(grade: Grade): GradeBadgeTone {
  return GRADE_BADGE_TONE[grade];
}

export function gradeBadgeClassName(grade: Grade): string {
  return TONE_CLASSES[gradeBadgeTone(grade)];
}
