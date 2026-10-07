import type {
  CourseCategory,
  CourseInstructor,
  CourseListItem,
  CurriculumRequirement,
  InstructorListItem,
  Prerequisite,
} from '@eduanalyze-ai/shared-types';
import {
  buildCurriculumView,
  categoryOpenByDefault,
  categorySummary,
  type CurriculumFilters,
  UNKNOWN_INSTRUCTOR,
} from './curriculum-view';

const T = '2026-01-01T00:00:00Z';
const course = (
  id: string,
  code: string,
  categoryId: string,
  over: Partial<CourseListItem> = {},
): CourseListItem => ({
  id,
  code,
  name: `ชื่อ ${code}`,
  nameEn: null,
  credits: 3,
  isRequired: true,
  isActive: true,
  curriculumId: 'C1',
  categoryId,
  ...over,
});
const category = (id: string): CourseCategory => ({
  id,
  name: `หมวด ${id}`,
  code: null,
  isActive: true,
  createdAt: T,
  updatedAt: T,
  curriculumId: 'C1',
});

const courses = [
  course('a', 'CPE101', 'K1', { nameEn: 'Intro to Programming' }),
  course('b', 'CPE201', 'K1'),
  course('c', 'CPE433', 'K2', { credits: 2 }),
  course('d', 'OLD001', 'K1', { isActive: false }),
  course('e', 'GEN101', 'K3', { curriculumId: 'C2' }),
];
const categories = [category('K1'), category('K2'), { ...category('K3'), curriculumId: 'C2' }];
const requirements: CurriculumRequirement[] = [
  {
    id: 'R1',
    minCredits: 12,
    minCourses: null,
    createdAt: T,
    updatedAt: T,
    curriculumId: 'C1',
    categoryId: 'K1',
  },
];
const prerequisites: Prerequisite[] = [
  { id: 'p1', courseId: 'b', prerequisiteCourseId: 'a', groupId: null, createdAt: T },
  { id: 'p2', courseId: 'c', prerequisiteCourseId: 'b', groupId: null, createdAt: T },
  { id: 'p3', courseId: 'c', prerequisiteCourseId: 'a', groupId: null, createdAt: T },
];
const instructors: InstructorListItem[] = [
  { id: 'i1', fullName: 'อาจารย์ ก', email: 'a@example.test' },
  { id: 'i2', fullName: 'อาจารย์ ข', email: 'b@example.test' },
];
const assignments: CourseInstructor[] = [
  { id: 'x1', userId: 'i1', courseId: 'a', createdAt: T },
  { id: 'x2', userId: 'i2', courseId: 'a', createdAt: T },
  { id: 'x3', userId: 'i1', courseId: 'b', createdAt: T },
  { id: 'x4', userId: 'i1', courseId: 'd', createdAt: T }, // a closed course: does not count
  { id: 'x5', userId: 'gone', courseId: 'b', createdAt: T },
];
const none: CurriculumFilters = { search: '', categoryId: null, instructor: 'all' };
const view = (filters: CurriculumFilters = none) =>
  buildCurriculumView({
    curriculumId: 'C1',
    courses,
    categories,
    requirements,
    prerequisites,
    assignments,
    instructors,
    filters,
  });

describe('buildCurriculumView', () => {
  it('counts only the active courses of the chosen curriculum', () => {
    const v = view();
    expect(v.totalCourses).toBe(3);
    expect(v.totalCredits).toBe(8);
  });

  it('counts courses with nobody assigned, ignoring closed courses', () => {
    expect(view().withoutInstructor).toBe(1); // CPE433 only
  });

  it('leaves out the other curriculum and its categories', () => {
    expect(view().blocks.map((b) => b.category.id)).toEqual(['K1', 'K2']);
  });

  it('sums the credits on offer per category and attaches the requirement', () => {
    const [k1, k2] = view().blocks;
    expect(k1.credits).toBe(6);
    expect(k1.requirement?.minCredits).toBe(12);
    expect(k1.courseCount).toBe(2);
    expect(k2.requirement).toBeUndefined();
  });

  it('lists several instructors on one course and names an unknown one plainly', () => {
    const rows = view().blocks[0].rows;
    expect(rows[0].instructors.map((i) => i.name)).toEqual(['อาจารย์ ก', 'อาจารย์ ข']);
    expect(rows[1].instructors.map((i) => i.name)).toEqual(['อาจารย์ ก', UNKNOWN_INSTRUCTOR]);
  });

  it('gives prerequisites as course codes only, in order', () => {
    const rows = view().blocks.flatMap((b) => b.rows);
    expect(rows.find((r) => r.course.id === 'c')?.prerequisiteCodes).toEqual(['CPE101', 'CPE201']);
    expect(rows.find((r) => r.course.id === 'a')?.prerequisiteCodes).toEqual([]);
  });

  it('searches code, Thai name and English name', () => {
    const ids = (search: string) =>
      view({ ...none, search }).blocks.flatMap((b) => b.rows.map((r) => r.course.id));
    expect(ids('cpe4')).toEqual(['c']);
    expect(ids('intro to')).toEqual(['a']);
    expect(ids('ชื่อ CPE201')).toEqual(['b']);
  });

  it('filters by instructor status without changing the totals', () => {
    const v = view({ ...none, instructor: 'none' });
    expect(v.blocks.flatMap((b) => b.rows.map((r) => r.course.id))).toEqual(['c']);
    expect(v.totalCourses).toBe(3);
    expect(v.blocks[0].courseCount).toBe(2);
  });

  it('shows only the chosen category', () => {
    expect(view({ ...none, categoryId: 'K2' }).blocks.map((b) => b.category.id)).toEqual(['K2']);
  });

  it('lists each assigned instructor once, with their active courses', () => {
    const entries = view().instructorEntries;
    expect(entries.map((e) => e.name).sort()).toEqual(
      [UNKNOWN_INSTRUCTOR, 'อาจารย์ ก', 'อาจารย์ ข'].sort(),
    );
    expect(entries.find((e) => e.userId === 'i1')?.courses.map((c) => c.code)).toEqual([
      'CPE101',
      'CPE201',
    ]);
  });
});

describe('categorySummary', () => {
  it('says how many courses and how many still have no instructor', () => {
    expect(categorySummary(5, 2)).toBe('5 วิชา · ยังไม่มีอาจารย์ 2');
    expect(categorySummary(5, 0)).toBe('5 วิชา · มีอาจารย์ครบ');
    expect(categorySummary(0, 0)).toBe('ยังไม่มีรายวิชา');
  });
});

describe('category counts and default folding', () => {
  it('counts courses without an instructor per category, whatever the filters say', () => {
    const all = view();
    expect(all.blocks.reduce((sum, b) => sum + b.withoutInstructor, 0)).toBe(all.withoutInstructor);
    const searched = view({ ...none, search: 'zzz-no-match' });
    expect(searched.blocks.map((b) => b.withoutInstructor)).toEqual(
      all.blocks.map((b) => b.withoutInstructor),
    );
  });

  it('starts folded when nothing is filtered', () => {
    expect(view().blocks.some((b) => categoryOpenByDefault(b, none, null))).toBe(false);
  });

  it('opens only the categories that have results for the instructor filter or a search', () => {
    const filters: CurriculumFilters = { ...none, instructor: 'none' };
    const opened = view(filters).blocks.map((b) => categoryOpenByDefault(b, filters, null));
    const expected = view(filters).blocks.map((b) => b.rows.length > 0);
    expect(opened).toEqual(expected);
    expect(opened.some(Boolean)).toBe(true);
    const search: CurriculumFilters = { ...none, search: 'zzz-no-match' };
    expect(view(search).blocks.some((b) => categoryOpenByDefault(b, search, null))).toBe(false);
  });

  it('opens the category of a linked course', () => {
    const blocks = view().blocks;
    const target = blocks.find((b) => b.rows.length > 0)!;
    const id = target.rows[0].course.id;
    expect(categoryOpenByDefault(target, none, id)).toBe(true);
    const other = blocks.find((b) => b !== target && b.rows.length > 0);
    if (other) expect(categoryOpenByDefault(other, none, id)).toBe(false);
  });
});
