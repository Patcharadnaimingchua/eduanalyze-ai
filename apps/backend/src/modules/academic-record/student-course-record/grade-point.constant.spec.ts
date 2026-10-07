import { gpaRiskLevel } from './grade-point.constant';

describe('gpaRiskLevel', () => {
  it.each([
    [1.49, 'CRITICAL'],
    [1.5, 'WATCH'],
    [1.74, 'WATCH'],
    [1.75, 'NORMAL'],
    [0, 'CRITICAL'],
    [4, 'NORMAL'],
  ])('reads GPA %s as %s', (gpa, expected) => {
    expect(gpaRiskLevel(gpa)).toBe(expected);
  });

  it('gives no band when there is no GPA', () => {
    expect(gpaRiskLevel(null)).toBeNull();
  });
});
