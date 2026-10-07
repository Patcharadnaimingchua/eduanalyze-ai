import type { Grade, InstructorCourseSummary, InstructorCourseTimelineYear } from '@eduanalyze-ai/shared-types';
import {
  buildCourseSnapshot,
  changeLine,
  courseTermInfo,
  dataLevelOf,
  gradedPeopleLine,
  snapshotStatus,
  summaryLine,
} from './course-snapshot';
import { emptyCounts, summarizeParts } from './instructor-overview';

const counts = (c: Partial<Record<Grade, number>>) => ({ ...emptyCounts(), ...c });

function course(
  dist: Partial<Record<Grade, number>>,
  overrides: Partial<InstructorCourseSummary> = {},
): InstructorCourseSummary {
  return {
    courseId: 'c1',
    code: '02739111',
    name: 'วิชาตัวอย่าง',
    studentCount: 0,
    atRiskStudents: [],
    achievementPercent: 0,
    achievementThreshold: 70,
    gradeDistribution: counts(dist),
    clos: [],
    plos: [],
    courseAssessment: { courseId: 'c1', submissionCount: 0, clos: [] },
    semesterTrend: [],
    ...overrides,
  };
}

const seat = (id: string, grade: Grade) => ({ studentProfileId: id, courseId: 'c1', grade });

describe('dataLevelOf', () => {
  it('splits at 5 and 10 people', () => {
    expect(dataLevelOf(0)).toBe('insufficient');
    expect(dataLevelOf(4)).toBe('insufficient');
    expect(dataLevelOf(5)).toBe('low');
    expect(dataLevelOf(9)).toBe('low');
    expect(dataLevelOf(10)).toBe('ok');
    expect(dataLevelOf(Number.NaN)).toBe('insufficient');
  });
});

describe('snapshotStatus', () => {
  it('gives no verdict below 5 people, and none for nobody', () => {
    expect(snapshotStatus(summarizeParts([{ counts: counts({ A: 4 }), credits: null }]), 70)).toBe('sparse');
    expect(snapshotStatus(summarizeParts([{ counts: counts({ W: 3 }), credits: null }]), 70)).toBe('none');
    expect(snapshotStatus(summarizeParts([{ counts: counts({}), credits: null }]), 70)).toBe('none');
  });

  it('judges against the goal from 5 people', () => {
    expect(snapshotStatus(summarizeParts([{ counts: counts({ A: 5 }), credits: null }]), 70)).toBe('met');
    expect(snapshotStatus(summarizeParts([{ counts: counts({ A: 3, F: 2 }), credits: null }]), 70)).toBe('below');
  });
});

describe('buildCourseSnapshot', () => {
  it('flags a course with no grade as empty', () => {
    const s = buildCourseSnapshot({ course: course({}), seatRows: [], yearLevelByStudent: new Map() });
    expect(s.empty).toBe(true);
    expect(s.status).toBe('none');
  });

  it('reads the share, level and goal of a normal course', () => {
    const s = buildCourseSnapshot({
      course: course({ A: 6, B: 4, C: 2, F: 1, W: 1 }),
      seatRows: [],
      yearLevelByStudent: null,
    });
    expect(s.stats.seats).toBe(14);
    expect(s.stats.counted).toBe(13);
    expect(s.stats.achievedPercent).toBeCloseTo((10 / 13) * 100);
    expect(s.level).toBe('ok');
    expect(s.status).toBe('met');
    expect(s.target).toBe(70);
    expect(s.years).toBeNull();
  });

  it('hides numbers and verdicts for year levels under 5 people', () => {
    const rows = [
      ...['a', 'b', 'c', 'd'].map((id) => seat(id, 'A')),
      ...['e', 'f', 'g', 'h', 'i', 'j'].map((id) => seat(id, 'B')),
    ];
    const level = new Map<string, number>([
      ...['a', 'b', 'c', 'd'].map((id) => [id, 1] as [string, number]),
      ...['e', 'f', 'g', 'h', 'i', 'j'].map((id) => [id, 2] as [string, number]),
    ]);
    const s = buildCourseSnapshot({ course: course({ A: 4, B: 6 }), seatRows: rows, yearLevelByStudent: level });
    const [y1, y2] = s.years!.rows;
    expect(y1).toMatchObject({ yearLevel: 1, level: 'insufficient', status: 'sparse', showNumbers: false });
    expect(y2).toMatchObject({ yearLevel: 2, level: 'low', status: 'met', showNumbers: true });
    expect(s.years!.unplaced).toBe(0);
  });

  it('counts seats with no year level as unplaced', () => {
    const s = buildCourseSnapshot({
      course: course({ A: 2 }),
      seatRows: [seat('a', 'A'), seat('b', 'A')],
      yearLevelByStudent: new Map([['a', 1]]),
    });
    expect(s.years!.unplaced).toBe(1);
  });

  it('judges goals only from 5 people, never invents a percentage', () => {
    const clos = [
      { cloId: 'k1', code: 'CLO1', description: 'หนึ่ง', threshold: 70, isAchieved: true },
      { cloId: 'k2', code: 'CLO2', description: 'สอง', threshold: 70, isAchieved: false },
    ];
    const few = buildCourseSnapshot({ course: course({ A: 3 }, { clos }), seatRows: [], yearLevelByStudent: null });
    expect(few.goals).toMatchObject({ sparse: true, met: 0, unmet: 0 });
    expect(few.goals.items.every((g) => g.state === 'unknown')).toBe(true);
    const enough = buildCourseSnapshot({ course: course({ A: 8 }, { clos }), seatRows: [], yearLevelByStudent: null });
    expect(enough.goals).toMatchObject({ sparse: false, met: 1, unmet: 1 });
  });

  it('shares the A to F row out of 100 and counts F, W, I, S/U on their own', () => {
    const s = buildCourseSnapshot({
      course: course({ A: 2, B: 2, F: 1, W: 2, I: 1, S: 1, U: 1 }),
      seatRows: [],
      yearLevelByStudent: null,
    });
    expect(s.grades.scored).toBe(5);
    expect(s.grades.segments.reduce((sum, g) => sum + g.percent, 0)).toBeCloseTo(100);
    expect(s.grades).toMatchObject({ f: 1, w: 2, incomplete: 1, notGraded: 2 });
  });

  it('needs 3 terms for a trend, and no change when a term is too small', () => {
    const point = (term: 'FIRST' | 'SECOND', year: number, n: number, pct: number) => ({
      academicYear: year,
      semesterTerm: term,
      studentCount: n,
      achievementPercent: pct,
    });
    const two = buildCourseSnapshot({
      course: course({ A: 8 }, { semesterTrend: [point('FIRST', 2567, 20, 60), point('SECOND', 2567, 20, 70)] }),
      seatRows: [],
      yearLevelByStudent: null,
    });
    expect(two.trend.enough).toBe(false);
    const three = buildCourseSnapshot({
      course: course(
        { A: 8 },
        {
          semesterTrend: [point('FIRST', 2566, 20, 50), point('FIRST', 2567, 20, 60), point('SECOND', 2567, 20, 72)],
        },
      ),
      seatRows: [],
      yearLevelByStudent: null,
    });
    expect(three.trend.enough).toBe(true);
    expect(three.trend.terms.map((t) => t.isLatest)).toEqual([false, false, true]);
    expect(three.trend.change?.points).toBe(12);
    const tiny = buildCourseSnapshot({
      course: course(
        { A: 8 },
        {
          semesterTrend: [point('FIRST', 2566, 20, 50), point('FIRST', 2567, 20, 60), point('SECOND', 2567, 3, 100)],
        },
      ),
      seatRows: [],
      yearLevelByStudent: null,
    });
    expect(tiny.trend.terms[2].showNumbers).toBe(false);
    expect(tiny.trend.change).toBeNull();
  });
});

describe('courseTermInfo', () => {
  const years: InstructorCourseTimelineYear[] = [
    {
      academicYear: 2567,
      semesters: [
        {
          semesterId: 's1',
          semesterTerm: 'SECOND',
          courses: [{ courseId: 'c1', code: 'x', name: 'x', programCode: 'CS', curriculumYear: 2565, studentCount: 5, predominantYearLevel: 2 }],
        },
        {
          semesterId: 's0',
          semesterTerm: 'FIRST',
          courses: [{ courseId: 'c1', code: 'x', name: 'x', programCode: 'CS', curriculumYear: 2560, studentCount: 5, predominantYearLevel: 2 }],
        },
      ],
    },
  ];

  it('uses the latest term the course appears in', () => {
    expect(courseTermInfo(years, 'c1')).toEqual({ termLabel: 'ภาคปลาย / 2567', curriculum: 'หลักสูตร CS ปี 2565' });
  });

  it('is null for a course that was never taught', () => {
    expect(courseTermInfo(years, 'other')).toBeNull();
  });
});

describe('words', () => {
  it('says "from the data we have" and never claims more', () => {
    const s = buildCourseSnapshot({ course: course({ A: 8, F: 2 }), seatRows: [], yearLevelByStudent: null });
    expect(summaryLine(s)).toBe('จากข้อมูลที่มี 80% ได้ B ขึ้นไป · เป้า 70%');
    expect(gradedPeopleLine(s.stats)).toBe('จากนักศึกษาที่มีเกรด 10 คน');
    expect(changeLine({ points: -4, fromLabel: 'ภาคต้น / 2567', toLabel: 'x' })).toBe(
      'จากข้อมูลที่มี ลดลง 4 จุด เมื่อเทียบภาคต้น / 2567',
    );
    expect(changeLine({ points: 0, fromLabel: 'ก', toLabel: 'ข' })).toContain('ใกล้เคียงเดิม');
  });

  it('keeps W and I out of the sentence base and says so', () => {
    const s = buildCourseSnapshot({ course: course({ A: 8, W: 2, I: 1 }), seatRows: [], yearLevelByStudent: null });
    expect(gradedPeopleLine(s.stats)).toBe('จากนักศึกษาที่มีเกรด 11 คน (ไม่รวมถอนหรือยังไม่สมบูรณ์ 3 คน ในร้อยละ B ขึ้นไป)');
  });
});
