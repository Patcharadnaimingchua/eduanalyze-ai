// One scale for achievement everywhere in the instructor pages: a whole-number
// percent. (The 0-5 conversion in five-scale.ts is kept for the pages that
// still use it, and is never applied next to a percent.)
export function formatPercent(value: number | null | undefined, noDataLabel = '—'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return noDataLabel;
  return `${Math.round(value)}%`;
}
