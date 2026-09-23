import type { CreditLimitRequestType } from '@eduanalyze-ai/shared-types';

// No minimum-credit warning existed in the planner before this feature —
// 9 is a new, standalone constant (not read from Curriculum, which only
// has maxCreditsPerSemester) purely to give the BELOW_MIN preset a
// warning to relax.
export const MIN_CREDITS_WARNING = 9;

export const CREDIT_LIMIT_PRESETS: Record<
  CreditLimitRequestType,
  { label: string; effectiveMax?: number; effectiveMin?: number }
> = {
  EXCEED_MAX: { label: '23-25 หน่วยกิต', effectiveMax: 25 },
  BELOW_MIN: { label: 'ต่ำกว่า 9 หน่วยกิต', effectiveMin: 0 },
};
