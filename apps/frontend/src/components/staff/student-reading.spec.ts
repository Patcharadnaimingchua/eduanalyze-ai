import { readStudentRisk } from './student-reading';

// The band itself is decided backend-side (gpaRiskLevel); this only reads what
// comes back, so the boundary GPAs are checked there. Here: no GPA = no data.
describe('readStudentRisk', () => {
  it('reads a student with no GPA as no data, not normal', () => {
    expect(readStudentRisk({ riskLevel: 'NORMAL', gpa: null })).toEqual({
      key: 'NO_DATA',
      label: 'ยังไม่มีข้อมูล',
      tone: 'neutral',
    });
  });

  it.each([
    [1.49, 'CRITICAL', 'เร่งด่วน', 'danger'],
    [1.5, 'WATCH', 'เฝ้าระวัง', 'warning'],
    [1.74, 'WATCH', 'เฝ้าระวัง', 'warning'],
    [1.75, 'NORMAL', 'ปกติ', 'success'],
  ] as const)('shows the backend band for GPA %s', (gpa, riskLevel, label, tone) => {
    expect(readStudentRisk({ riskLevel, gpa })).toEqual({ key: riskLevel, label, tone });
  });
});
