import type { BadgeTone } from '@/components/ui/badge';

// Replaces the old fixed 80/60 bands (achievement-color.ts), which were
// unrelated to the pass bar the rest of the app actually uses. The
// green/red boundary here is exactly `percent >= threshold` — the same
// comparison the backend uses for CloAchievementEntry.isAchieved — so a
// badge can never contradict whether a CLO reads as achieved.
//
// EXCEEDED's margin mirrors the 15-point band ploProgressBarColorClassName
// already uses on the other side of the threshold.
//
// percent and threshold are both raw 0-100 values. Never pass a
// percentToFiveScale() result here (see five-scale.ts).
const EXCEEDED_MARGIN = 15;

export function achievementStatus(
  percent: number,
  threshold: number,
): { label: string; tone: BadgeTone } {
  if (percent >= threshold + EXCEEDED_MARGIN) {
    return { label: 'EXCEEDED', tone: 'green' };
  }
  if (percent >= threshold) {
    return { label: 'ON TRACK', tone: 'green' };
  }
  return { label: 'CRITICAL', tone: 'red' };
}
