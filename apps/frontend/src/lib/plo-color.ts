// Same pattern as gpa-color.ts: color decided from the target value only,
// never a mid-animation number, so it doesn't flicker between bands.
// Threshold-relative (not fixed bands like GPA) since PLO achievement is a
// percent measured against the curriculum's own pass threshold.
export function ploProgressBarColorClassName(
  value: number | null,
  threshold: number | null,
): string {
  if (value === null) return 'bg-slate-300';
  if (threshold === null) return 'bg-primary';
  if (value >= threshold) return 'bg-emerald-600';
  if (value >= threshold - 15) return 'bg-amber-500';
  return 'bg-destructive';
}
