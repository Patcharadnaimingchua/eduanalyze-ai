import { buildGpaTrend } from './gpa-trend';

const sem = (
  academicYear: number,
  semesterTerm: 'FIRST' | 'SECOND' | 'SUMMER',
  gpa: number | null,
  creditsCounted = 15,
) => ({ academicYear, semesterTerm, gpa, creditsCounted });

describe('buildGpaTrend', () => {
  it('returns an empty list for no semesters', () => {
    expect(buildGpaTrend([])).toEqual([]);
  });

  it('sorts by academic year, then by term within a year', () => {
    const result = buildGpaTrend([
      sem(2567, 'SECOND', 3.1),
      sem(2566, 'SUMMER', 2.5),
      sem(2567, 'FIRST', 2.9),
      sem(2566, 'FIRST', 3.4),
    ]);
    expect(result.map((p) => [p.academicYear, p.semesterTerm])).toEqual([
      [2566, 'FIRST'],
      [2566, 'SUMMER'],
      [2567, 'FIRST'],
      [2567, 'SECOND'],
    ]);
  });

  it('drops semesters with a null GPA instead of plotting them as 0', () => {
    const result = buildGpaTrend([
      sem(2566, 'FIRST', 3.0),
      sem(2566, 'SECOND', null, 0),
      sem(2567, 'FIRST', 3.5),
    ]);
    expect(result.map((p) => p.gpa)).toEqual([3.0, 3.5]);
  });

  it('keeps a genuine 0.00 GPA', () => {
    expect(buildGpaTrend([sem(2566, 'FIRST', 0)]).map((p) => p.gpa)).toEqual([0]);
  });

  it('does not mutate its input', () => {
    const input = [sem(2567, 'FIRST', 3.0), sem(2566, 'FIRST', 2.0)];
    buildGpaTrend(input);
    expect(input[0].academicYear).toBe(2567);
  });
});
