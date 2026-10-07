import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import type { SemanticTone } from '@/lib/tone';

// Display only — the split itself is decided backend-side in
// grade-point.constant.ts: gpaRiskLevel() for a student's status (Staff,
// Admin), riskLevel() for one grade in one course (Instructor).
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  CRITICAL: 'เร่งด่วน',
  WATCH: 'เฝ้าระวัง',
  NORMAL: 'ปกติ',
};

export const RISK_LEVEL_TONES: Record<RiskLevel, SemanticTone> = {
  CRITICAL: 'danger',
  WATCH: 'warning',
  NORMAL: 'success',
};

// Worst first, matching how the backend already sorts at-risk attempts.
export const RISK_LEVEL_ORDER: RiskLevel[] = ['CRITICAL', 'WATCH', 'NORMAL'];
