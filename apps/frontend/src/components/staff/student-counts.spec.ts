import { activeStudents, countStudents } from './student-counts';

const student = (isActive: boolean) => ({ isActive });

describe('countStudents', () => {
  it('counts active and suspended students separately', () => {
    expect(countStudents([student(true), student(true), student(false)])).toEqual({
      active: 2,
      suspended: 1,
    });
  });

  it('reports zero suspended when everyone is active', () => {
    expect(countStudents([student(true)])).toEqual({ active: 1, suspended: 0 });
  });

  it('handles an empty list', () => {
    expect(countStudents([])).toEqual({ active: 0, suspended: 0 });
  });
});

describe('activeStudents', () => {
  it('drops suspended students and keeps the rest of each row', () => {
    const rows = [
      { id: 'a', isActive: true },
      { id: 'b', isActive: false },
    ];
    expect(activeStudents(rows)).toEqual([{ id: 'a', isActive: true }]);
  });
});
