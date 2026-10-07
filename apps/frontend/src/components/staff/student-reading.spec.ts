import {
  countGradedByCurriculum,
  readAverageGpa,
  readStudentRisk,
  STAFF_RISK_ORDER,
} from './student-reading';

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

  it('orders no data after normal', () => {
    expect(STAFF_RISK_ORDER.indexOf('NO_DATA')).toBeGreaterThan(STAFF_RISK_ORDER.indexOf('NORMAL'));
  });
});

describe('countGradedByCurriculum', () => {
  it('counts only active students that have a GPA, per curriculum', () => {
    const counts = countGradedByCurriculum([
      { curriculumId: 'a', isActive: true, gpa: 3 },
      { curriculumId: 'a', isActive: true, gpa: null },
      { curriculumId: 'a', isActive: false, gpa: 2 },
      { curriculumId: 'b', isActive: true, gpa: 2.5 },
    ]);
    expect(counts.get('a')).toBe(1);
    expect(counts.get('b')).toBe(1);
    expect(counts.get('c')).toBeUndefined();
  });
});

describe('readAverageGpa', () => {
  it('says no data when nobody has a grade', () => {
    expect(readAverageGpa(null, 0)).toEqual({ kind: 'none', text: 'ยังไม่มีข้อมูล' });
  });

  it('gives no number under 5 graded people', () => {
    expect(readAverageGpa(3.1, 4)).toEqual({ kind: 'few', text: 'ข้อมูลยังน้อย (มีเกรด 4 คน)' });
  });

  it('shows the number and its base from 5 graded people', () => {
    expect(readAverageGpa(3.123, 5)).toEqual({
      kind: 'ok',
      text: '3.12 · เฉลี่ยจาก 5 คนที่มีเกรด',
    });
  });
});
