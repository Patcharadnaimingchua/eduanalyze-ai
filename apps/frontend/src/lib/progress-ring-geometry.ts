import { dataLevelOf } from './course-snapshot';

// The ring for "B or above" needs a graded group big enough to mean something;
// the threshold is the one the course pages already use for "too few people".
export function showAchievementRing(counted: number, percent: number | null): percent is number {
  return percent !== null && Number.isFinite(percent) && dataLevelOf(counted) !== 'insufficient';
}

// Credits offered in a category against the credits its rule asks for, as a
// 0-100 share for a ring. null when there is no usable rule.
export function creditShare(credits: number, minCredits: number | null | undefined): number | null {
  if (minCredits === null || minCredits === undefined) return null;
  if (!Number.isFinite(minCredits) || minCredits <= 0 || !Number.isFinite(credits)) return null;
  return Math.max(0, Math.min(100, (credits / minCredits) * 100));
}

// "N out of M" as a 0-100 share; null when M is 0.
export function countShare(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

// The two ends of a short mark across the ring stroke at `percent` of the way
// round, clockwise from the top. Same geometry as ProgressRing.
export function ringTick(size: number, strokeWidth: number, percent: number) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const centre = size / 2;
  const angle = (clamped / 100) * 2 * Math.PI;
  const at = (r: number) => ({
    x: Number((centre + r * Math.sin(angle)).toFixed(2)),
    y: Number((centre - r * Math.cos(angle)).toFixed(2)),
  });
  const reach = strokeWidth / 2 + 3;
  return { from: at(radius - reach), to: at(radius + reach) };
}
