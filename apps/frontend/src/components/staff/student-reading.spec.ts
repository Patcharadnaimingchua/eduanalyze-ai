import { readStudentRisk } from './student-reading';

describe('readStudentRisk', () => {
  it('reads a student with no grades at all as no data, not normal', () => {
    expect(readStudentRisk({ riskLevel: 'NORMAL', gpa: null, atRiskCourseCount: 0 })).toEqual({
      key: 'NO_DATA',
      label: 'ยังไม่มีข้อมูล',
      tone: 'neutral',
    });
  });

  it('keeps NORMAL for a student who has a GPA', () => {
    expect(readStudentRisk({ riskLevel: 'NORMAL', gpa: 3.2, atRiskCourseCount: 0 })).toMatchObject({
      key: 'NORMAL',
      label: 'ปกติ',
      tone: 'success',
    });
  });

  it('does not hide a CRITICAL student whose only grade has no GPA weight', () => {
    expect(
      readStudentRisk({ riskLevel: 'CRITICAL', gpa: null, atRiskCourseCount: 1 }),
    ).toMatchObject({
      key: 'CRITICAL',
      tone: 'danger',
    });
  });
});
