import type { BadgeTone } from '@/components/ui/badge';

// Fixed bands, not threshold-relative like plo-color.ts's
// ploProgressBarColorClassName — the instructor dashboard's
// achievementPercent (% of a course graded B-or-above) has no per-course
// threshold from the backend to compare against, so this mirrors
// gpa-color.ts's fixed-band approach instead.
export function achievementBadgeTone(percent: number): BadgeTone {
  if (percent >= 80) return 'green';
  if (percent >= 60) return 'amber';
  return 'red';
}
