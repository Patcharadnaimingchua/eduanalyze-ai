export type OnTrackStatus = 'on_track' | 'behind';

// Bucketing/risk views cap at 4 (a catch-all "4 and beyond" band); the
// on-track rule below deliberately does NOT use this clamp.
export function resolveYearLevel(
  academicYear: number,
  admissionYear: number,
): number {
  return Math.min(Math.max(academicYear - admissionYear + 1, 1), 4);
}

// Credits a student should have at the START of the current academic year:
// totalCredits * elapsedYears / durationYears, capped at totalCredits.
// elapsedYears is unclamped so a student past the nominal duration expects
// 100%, not a permanent 75%.
export function expectedCreditsByNow(
  totalCredits: number,
  durationYears: number,
  currentAcademicYear: number,
  admissionYear: number,
): number {
  const elapsedYears = Math.max(0, currentAcademicYear - admissionYear);
  if (durationYears <= 0) return totalCredits;
  return Math.min(
    totalCredits,
    Math.ceil((totalCredits * elapsedYears) / durationYears),
  );
}

// null = no badge (nothing left to be on/behind track for).
export function resolveOnTrackStatus(
  creditsPassed: number,
  totalCredits: number,
  expectedCredits: number,
): OnTrackStatus | null {
  if (totalCredits <= 0 || creditsPassed >= totalCredits) return null;
  return creditsPassed < expectedCredits ? 'behind' : 'on_track';
}
