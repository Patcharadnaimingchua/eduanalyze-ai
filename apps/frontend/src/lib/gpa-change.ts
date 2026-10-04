import type { GpaTrendPoint } from '@eduanalyze-ai/shared-types';

export type GpaChangeDirection = 'up' | 'down' | 'flat';

export interface GpaChange {
  direction: GpaChangeDirection;
  // Signed (latest − previous); 0 when flat.
  delta: number;
}

// Below half a hundredth the two terms are the same GPA at the 2 decimals we show.
const FLAT_BELOW = 0.005;

// gpaTrend is oldest → newest and holds per-term GPAs, so this is the latest
// term against the one before it, not a change in the cumulative GPA.
export function computeGpaChange(
  trend: readonly Pick<GpaTrendPoint, 'gpa'>[] | null | undefined,
): GpaChange | null {
  if (!trend || trend.length < 2) return null;
  const latest = trend[trend.length - 1].gpa;
  const previous = trend[trend.length - 2].gpa;
  if (!Number.isFinite(latest) || !Number.isFinite(previous)) return null;

  const delta = latest - previous;
  if (Math.abs(delta) < FLAT_BELOW) return { direction: 'flat', delta: 0 };
  return { direction: delta > 0 ? 'up' : 'down', delta };
}

// `signed` adds the +/− sign ("▲ +0.18"); the arrow already carries the
// direction, so running text uses the plain magnitude ("▲ 0.18").
export function formatGpaChange(change: GpaChange, { signed }: { signed: boolean }): string {
  if (change.direction === 'flat') return '– เท่าเดิม';
  const magnitude = (Math.round(Math.abs(change.delta) * 100) / 100).toFixed(2);
  if (change.direction === 'up') return `▲ ${signed ? '+' : ''}${magnitude} จากเทอมก่อน`;
  return `▼ ${signed ? '−' : ''}${magnitude} จากเทอมก่อน`;
}
