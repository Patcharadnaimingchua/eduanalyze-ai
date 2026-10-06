// "People" and "seats" differ: a student taking two of the instructor's courses
// is two seats but one person. Showing only one of the two made the dashboard
// say 5 while the students page said 2, so say both, in plain words.
export interface Headcount {
  // What to show as the big number, and its unit.
  value: number;
  unit: 'คน' | 'ที่นั่ง';
  // Why the number is not simply the seat count; null when they agree or when
  // people could not be counted.
  note: string | null;
}

const isCount = (n: number | null): n is number => n !== null && Number.isFinite(n) && n >= 0;

// `people` is null when the per-student list is not available (still loading
// or failed): then only the seat count is honest.
export function describeHeadcount(people: number | null, seats: number): Headcount {
  const safeSeats = Number.isFinite(seats) && seats > 0 ? seats : 0;
  if (!isCount(people)) return { value: safeSeats, unit: 'ที่นั่ง', note: null };
  if (people === safeSeats) return { value: people, unit: 'คน', note: null };
  return {
    value: people,
    unit: 'คน',
    note: `${safeSeats} ที่นั่ง เพราะบางคนเรียนหลายวิชา`,
  };
}
