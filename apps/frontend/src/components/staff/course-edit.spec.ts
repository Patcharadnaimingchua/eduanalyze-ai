import type { CourseListItem } from '@eduanalyze-ai/shared-types';
import {
  courseEditSchema,
  courseToFormValues,
  EDITABLE_COURSE_FIELDS,
  toCreateBody,
  toUpdateBody,
} from './course-edit';

const UUID = '00000000-0000-4000-8000-000000000001';
const course: CourseListItem = {
  id: 'x',
  code: 'CPE101',
  name: 'ชื่อ',
  nameEn: null,
  credits: 3,
  isRequired: true,
  isActive: true,
  curriculumId: 'C1',
  categoryId: UUID,
};

describe('toUpdateBody', () => {
  it('sends only the seven editable fields — never isActive or curriculumId', () => {
    const body = toUpdateBody({ ...courseToFormValues(course), description: 'รายละเอียด' });
    expect(Object.keys(body).sort()).toEqual([...EDITABLE_COURSE_FIELDS].sort());
    expect(body).not.toHaveProperty('isActive');
    expect(body).not.toHaveProperty('curriculumId');
  });

  it('clears the English name when it is emptied, and keeps the stored description when untouched', () => {
    const body = toUpdateBody({
      ...courseToFormValues({ ...course, nameEn: 'Intro' }),
      nameEn: '',
    });
    expect(body.nameEn).toBe('');
    expect(body).not.toHaveProperty('description');
  });
});

describe('toCreateBody', () => {
  it('carries the curriculum from the page and leaves empty optionals out', () => {
    const body = toCreateBody('C1', courseToFormValues(course));
    expect(body.curriculumId).toBe('C1');
    expect(body.nameEn).toBeUndefined();
    expect(body.description).toBeUndefined();
  });
});

describe('courseEditSchema', () => {
  const ok = courseToFormValues(course);

  it('accepts a course as the backend would', () => {
    expect(courseEditSchema.safeParse(ok).success).toBe(true);
  });

  it.each([
    ['code over 20', { code: 'x'.repeat(21) }],
    ['empty name', { name: '' }],
    ['name over 255', { name: 'ก'.repeat(256) }],
    ['English name over 255', { nameEn: 'a'.repeat(256) }],
    ['fractional credits', { credits: 2.5 }],
    ['negative credits', { credits: -1 }],
    ['category that is not an id', { categoryId: 'K1' }],
  ])('refuses %s', (_label, change) => {
    expect(courseEditSchema.safeParse({ ...ok, ...change }).success).toBe(false);
  });
});
