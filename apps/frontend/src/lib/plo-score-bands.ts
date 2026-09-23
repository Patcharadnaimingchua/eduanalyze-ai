// Display-only grouping for the CLO/PLO Analysis summary — shared between
// the page (counting each PLO into a band) and OverallAchievementCard
// (rendering the band legend). Raw achievement values, curriculum
// threshold, and achieved/not-achieved logic live elsewhere and are
// untouched by this.
export const SCORE_BANDS = [
  { key: 'excellent', label: 'ยอดเยี่ยม', minimum: 80, indicatorClassName: 'bg-emerald-600' },
  { key: 'good', label: 'ดี', minimum: 60, indicatorClassName: 'bg-emerald-500' },
  { key: 'fair', label: 'พอใช้', minimum: 40, indicatorClassName: 'bg-amber-500' },
  { key: 'needsWork', label: 'ควรพัฒนา', minimum: 0, indicatorClassName: 'bg-rose-500' },
] as const;

export type ScoreBandKey = (typeof SCORE_BANDS)[number]['key'];

export function scoreBandKey(value: number): ScoreBandKey {
  return SCORE_BANDS.find((band) => value >= band.minimum)!.key;
}
