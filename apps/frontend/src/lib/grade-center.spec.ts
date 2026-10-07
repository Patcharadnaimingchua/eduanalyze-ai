import type { Grade } from '@eduanalyze-ai/shared-types';
import {
  centerLine,
  formatGradeList,
  formatMedian,
  medianShade,
  summarizeGradeCenter,
} from './grade-center';

const dist = (d: Partial<Record<Grade, number>>) => d;
const values = (d: Partial<Record<Grade, number>>) => {
  const v = summarizeGradeCenter(dist(d)).values;
  if (!v) throw new Error('expected a centre');
  return v;
};

describe('summarizeGradeCenter: how many people', () => {
  it('under 5 people gives the count and nothing to say about the centre', () => {
    const c = summarizeGradeCenter(dist({ A: 1, B: 2, C: 1 }));
    expect(c).toEqual({ people: 4, level: 'insufficient', values: null });
    expect(centerLine(c)).toBeNull();
  });

  it('5 to 9 people is shown, marked low', () => {
    const five = summarizeGradeCenter(dist({ A: 2, B: 3 }));
    expect(five.level).toBe('low');
    expect(five.values).not.toBeNull();
    expect(summarizeGradeCenter(dist({ B: 9 })).level).toBe('low');
  });

  it('10 people or more is shown as is', () => {
    expect(summarizeGradeCenter(dist({ B: 10 })).level).toBe('ok');
  });

  it('4 people is thin, 5 is enough', () => {
    expect(summarizeGradeCenter(dist({ B: 4 })).values).toBeNull();
    expect(summarizeGradeCenter(dist({ B: 5 })).values).not.toBeNull();
  });

  it('nobody, or only W, I, S and U, has no people to read', () => {
    expect(summarizeGradeCenter({})).toEqual({ people: 0, level: 'insufficient', values: null });
    const onlyOthers = summarizeGradeCenter(dist({ W: 6, I: 4, S: 5, U: 5 }));
    expect(onlyOthers).toEqual({ people: 0, level: 'insufficient', values: null });
  });

  it('W, I, S and U do not count towards the 5', () => {
    expect(summarizeGradeCenter(dist({ A: 4, W: 3, I: 2, S: 1, U: 1 })).values).toBeNull();
    expect(summarizeGradeCenter(dist({ A: 5, W: 3 })).people).toBe(5);
  });

  it('ignores counts that are not real numbers', () => {
    const c = summarizeGradeCenter({ A: 5, B: Number.NaN, C: -3, F: Number.POSITIVE_INFINITY });
    expect(c.people).toBe(5);
    expect(c.values?.gpa).toBe(4);
  });
});

describe('mode', () => {
  it('is the grade seen most', () => {
    expect(values({ A: 2, B_PLUS: 5, B: 3 }).modes).toEqual(['B_PLUS']);
  });

  it('lists every grade that ties, best first', () => {
    expect(values({ C: 4, B_PLUS: 4, A: 1 }).modes).toEqual(['B_PLUS', 'C']);
    expect(values({ A: 2, B: 2, C: 2, D: 1 }).modes).toEqual(['A', 'B', 'C']);
  });

  it('a course with one grade is that grade', () => {
    expect(values({ B: 7 }).modes).toEqual(['B']);
  });
});

describe('median', () => {
  it('odd count: the middle person', () => {
    // A A B B+ ... lowest to highest: C, B, B, B+, A -> middle is B
    expect(values({ C: 1, B: 2, B_PLUS: 1, A: 1 }).median).toEqual({ low: 'B', high: 'B' });
  });

  it('even count, both middle people alike: one grade', () => {
    // 6 people: C C B B B A -> middle two are B and B
    expect(values({ C: 2, B: 3, A: 1 }).median).toEqual({ low: 'B', high: 'B' });
  });

  it('even count, the two middle people differ: low and high', () => {
    // 6 people: C C B B+ A A -> middle two are B and B+
    const m = values({ C: 2, B: 1, B_PLUS: 1, A: 2 }).median;
    expect(m).toEqual({ low: 'B', high: 'B_PLUS' });
    expect(formatMedian(m)).toBe('B ถึง B+');
  });

  it('one grade for everyone', () => {
    expect(values({ A: 5 }).median).toEqual({ low: 'A', high: 'A' });
  });

  it('is not moved by one extreme grade', () => {
    expect(values({ B: 8, F: 1 }).median).toEqual({ low: 'B', high: 'B' });
  });
});

describe('course GPA and the nearest grade', () => {
  it('is the mean of the grade points, with F as 0', () => {
    expect(values({ A: 2, B: 2, F: 1 }).gpa).toBeCloseTo((8 + 6 + 0) / 5);
  });

  it('rounds to the nearest grade', () => {
    expect(values({ A: 3, B_PLUS: 2 }).nearest).toBe('A'); // 3.8
    expect(values({ B: 4, C: 1 }).nearest).toBe('B'); // 2.8
    expect(values({ F: 5 }).nearest).toBe('F');
  });

  it('halfway exactly goes to the lower grade', () => {
    expect(values({ B_PLUS: 4, B: 4 }).gpa).toBe(3.25);
    expect(values({ B_PLUS: 4, B: 4 }).nearest).toBe('B');
    expect(values({ B: 4, C_PLUS: 4 }).nearest).toBe('C_PLUS'); // 2.75
    expect(values({ D: 4, F: 4 }).nearest).toBe('F'); // 0.5
    expect(values({ A: 4, B_PLUS: 4 }).nearest).toBe('B_PLUS'); // 3.75
  });

  it('just above halfway goes up', () => {
    expect(values({ B_PLUS: 5, B: 4 }).nearest).toBe('B_PLUS'); // 3.28
  });

  it('is formatted with 2 decimals in the line', () => {
    expect(centerLine(summarizeGradeCenter(dist({ A: 4, B_PLUS: 3, B: 2, C: 1 })))).toBe(
      'เกรดที่พบมากที่สุด A · เกรดกลาง B+ · GPA วิชา 3.45',
    );
  });
});

describe('highest, lowest and spread', () => {
  it('finds the best and worst grade that is there', () => {
    const v = values({ B_PLUS: 3, C: 2, D: 1 });
    expect(v.highest).toBe('B_PLUS');
    expect(v.lowest).toBe('D');
  });

  it('is 0 when everyone has the same grade', () => {
    expect(values({ C: 6 }).stdDev).toBe(0);
  });

  it('is the spread of the grade points over the whole group', () => {
    // points 4 4 0 0 0 0 ... : 5 people, mean 1.6
    const sd = values({ A: 2, F: 3 }).stdDev;
    expect(sd).toBeCloseTo(Math.sqrt((2 * (4 - 1.6) ** 2 + 3 * (0 - 1.6) ** 2) / 5));
  });
});

describe('words', () => {
  it('joins tied grades', () => {
    expect(formatGradeList(['B_PLUS'])).toBe('B+');
    expect(formatGradeList(['B_PLUS', 'B'])).toBe('B+ และ B');
    expect(formatGradeList(['A', 'B_PLUS', 'B'])).toBe('A, B+ และ B');
  });

  it('gives the full line for a normal course', () => {
    expect(centerLine(summarizeGradeCenter(dist({ A: 2, B_PLUS: 4, B: 3, C: 1, W: 2 })))).toBe(
      'เกรดที่พบมากที่สุด B+ · เกรดกลาง B+ · GPA วิชา 3.30',
    );
  });

  it('never prints NaN or undefined', () => {
    for (const d of [{}, { W: 3 }, { A: 1 }, { A: 5 }, { F: 12 }]) {
      expect(centerLine(summarizeGradeCenter(dist(d))) ?? '').not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});

describe('medianShade', () => {
  it('is one tint that gets darker as the middle grade goes up', () => {
    const shade = (low: Grade, high: Grade = low) => medianShade({ low, high });
    expect(shade('F')).toBe(0.06);
    expect(shade('A')).toBe(0.28);
    expect(shade('C')).toBeLessThan(shade('B'));
    expect(shade('B')).toBeLessThan(shade('A'));
    expect(shade('B', 'B_PLUS')).toBeGreaterThan(shade('B'));
    expect(shade('B', 'B_PLUS')).toBeLessThan(shade('B_PLUS'));
  });
});
