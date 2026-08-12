// Absolute-level GPA color — a static class decided from the target
// value only, never the mid-animation number (useCountUp's animated
// display), so the color doesn't flicker between bands while counting up.
export function gpaColorClassName(gpa: number | null): string {
  if (gpa === null) return 'text-muted-foreground';
  if (gpa >= 3.5) return 'text-emerald-700';
  if (gpa < 2.0) return 'text-destructive';
  return 'text-primary';
}
