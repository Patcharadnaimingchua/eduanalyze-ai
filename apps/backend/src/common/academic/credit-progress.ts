// Display figures derived from credits earned vs. credits required. A student
// who has earned more than the curriculum asks for reads "0 left" and 100%,
// never negative or over 100%. creditsPassed itself is NOT capped anywhere
// (140/130 is a true, showable number), and graduation rules such as
// creditsMet (`creditsPassed >= required`) must keep using the raw values.
export function creditsRemaining(
  totalCreditsRequired: number,
  creditsPassed: number,
): number {
  return Math.max(0, totalCreditsRequired - creditsPassed);
}

export function creditProgressPercent(
  creditsPassed: number,
  totalCreditsRequired: number,
): number {
  if (totalCreditsRequired <= 0) return 0;
  return Math.min(
    100,
    Math.max(0, (creditsPassed / totalCreditsRequired) * 100),
  );
}
