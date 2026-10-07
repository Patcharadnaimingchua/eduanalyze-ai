// The one place a Staff page decides how many students "in your care" there
// are. The year-level page and the per-curriculum overview (backend) already
// count active students only, so every Staff page counts the same way and
// reports the suspended ones beside the total instead of inside it.

export interface StudentCounts {
  active: number;
  suspended: number;
}

export function countStudents(students: readonly { isActive: boolean }[]): StudentCounts {
  const active = students.filter((student) => student.isActive).length;
  return { active, suspended: students.length - active };
}

export function activeStudents<T extends { isActive: boolean }>(students: readonly T[]): T[] {
  return students.filter((student) => student.isActive);
}
