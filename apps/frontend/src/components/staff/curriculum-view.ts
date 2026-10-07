import type {
  CourseCategory,
  CourseInstructor,
  CourseListItem,
  CurriculumRequirement,
  InstructorListItem,
  Prerequisite,
} from '@eduanalyze-ai/shared-types';

// Everything the curriculum page shows, worked out from the whole-list
// responses it already holds (one request per list, nothing per course).

export type InstructorFilter = 'all' | 'none' | 'has';

export interface CurriculumFilters {
  search: string;
  categoryId: string | null;
  instructor: InstructorFilter;
}

export interface CourseRowData {
  course: CourseListItem;
  prerequisiteCodes: string[];
  instructors: { assignmentId: string; userId: string; name: string }[];
}

export interface CategoryBlock {
  category: CourseCategory;
  requirement: CurriculumRequirement | undefined;
  // All the category's courses, whatever the filters say.
  courseCount: number;
  // Of those, how many have nobody assigned, whatever the filters say.
  withoutInstructor: number;
  credits: number;
  // Only what the filters let through.
  rows: CourseRowData[];
}

export interface InstructorEntry {
  userId: string;
  name: string;
  email: string;
  courses: { id: string; code: string; name: string }[];
}

export interface CurriculumView {
  totalCourses: number;
  totalCredits: number;
  withoutInstructor: number;
  blocks: CategoryBlock[];
  instructorEntries: InstructorEntry[];
}

export interface CurriculumViewInput {
  curriculumId: string;
  courses: readonly CourseListItem[];
  categories: readonly CourseCategory[];
  requirements: readonly CurriculumRequirement[];
  prerequisites: readonly Prerequisite[];
  assignments: readonly CourseInstructor[];
  instructors: readonly InstructorListItem[];
  filters: CurriculumFilters;
}

export const UNKNOWN_INSTRUCTOR = 'อาจารย์ที่ไม่อยู่ในรายชื่อ';

function matchesSearch(course: CourseListItem, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (term === '') return true;
  return [course.code, course.name, course.nameEn ?? ''].some((text) =>
    text.toLowerCase().includes(term),
  );
}

// The line under a collapsed category.
export function categorySummary(courseCount: number, withoutInstructor: number): string {
  if (courseCount === 0) return 'ยังไม่มีรายวิชา';
  return withoutInstructor > 0
    ? `${courseCount} วิชา · ยังไม่มีอาจารย์ ${withoutInstructor}`
    : `${courseCount} วิชา · มีอาจารย์ครบ`;
}

// Categories start folded. A search, an instructor or category filter, or a link
// to one course opens the categories that have something to show.
export function categoryOpenByDefault(
  block: Pick<CategoryBlock, 'rows'>,
  filters: CurriculumFilters,
  selectedCourseId: string | null,
): boolean {
  if (block.rows.length === 0) return false;
  const filtered =
    filters.search.trim() !== '' || filters.instructor !== 'all' || filters.categoryId !== null;
  const linked =
    selectedCourseId !== null && block.rows.some((r) => r.course.id === selectedCourseId);
  return filtered || linked;
}

export function buildCurriculumView(input: CurriculumViewInput): CurriculumView {
  const { curriculumId, filters } = input;
  const courses = input.courses.filter((c) => c.curriculumId === curriculumId && c.isActive);
  const courseById = new Map(input.courses.map((c) => [c.id, c]));
  const instructorById = new Map(input.instructors.map((i) => [i.id, i]));
  const courseIds = new Set(courses.map((c) => c.id));

  const assignmentsByCourse = new Map<string, CourseInstructor[]>();
  for (const assignment of input.assignments) {
    if (!courseIds.has(assignment.courseId)) continue;
    const list = assignmentsByCourse.get(assignment.courseId) ?? [];
    list.push(assignment);
    assignmentsByCourse.set(assignment.courseId, list);
  }

  const prerequisitesByCourse = new Map<string, string[]>();
  for (const prerequisite of input.prerequisites) {
    if (!courseIds.has(prerequisite.courseId)) continue;
    const code = courseById.get(prerequisite.prerequisiteCourseId)?.code;
    if (!code) continue;
    const list = prerequisitesByCourse.get(prerequisite.courseId) ?? [];
    list.push(code);
    prerequisitesByCourse.set(prerequisite.courseId, list);
  }

  const toRow = (course: CourseListItem): CourseRowData => ({
    course,
    prerequisiteCodes: [...(prerequisitesByCourse.get(course.id) ?? [])].sort((a, b) =>
      a.localeCompare(b),
    ),
    instructors: (assignmentsByCourse.get(course.id) ?? []).map((a) => ({
      assignmentId: a.id,
      userId: a.userId,
      name: instructorById.get(a.userId)?.fullName ?? UNKNOWN_INSTRUCTOR,
    })),
  });

  const requirementByCategory = new Map(input.requirements.map((r) => [r.categoryId, r]));
  const byCode = (a: CourseRowData, b: CourseRowData) => a.course.code.localeCompare(b.course.code);

  const blocks: CategoryBlock[] = input.categories
    .filter((c) => c.curriculumId === curriculumId && c.isActive)
    .map((category) => {
      const inCategory = courses
        .filter((c) => c.categoryId === category.id)
        .map(toRow)
        .sort(byCode);
      return {
        category,
        requirement: requirementByCategory.get(category.id),
        courseCount: inCategory.length,
        withoutInstructor: inCategory.filter(({ instructors }) => instructors.length === 0).length,
        credits: inCategory.reduce((sum, row) => sum + row.course.credits, 0),
        rows: inCategory.filter(
          ({ course, instructors }) =>
            (filters.categoryId === null || filters.categoryId === category.id) &&
            matchesSearch(course, filters.search) &&
            (filters.instructor === 'all' ||
              (filters.instructor === 'none' ? instructors.length === 0 : instructors.length > 0)),
        ),
      };
    })
    .filter((block) => filters.categoryId === null || block.category.id === filters.categoryId);

  const instructorCourses = new Map<string, InstructorEntry['courses']>();
  for (const course of courses) {
    for (const assignment of assignmentsByCourse.get(course.id) ?? []) {
      const list = instructorCourses.get(assignment.userId) ?? [];
      list.push({ id: course.id, code: course.code, name: course.name });
      instructorCourses.set(assignment.userId, list);
    }
  }
  const instructorEntries = [...instructorCourses.entries()]
    .map(([userId, list]) => ({
      userId,
      name: instructorById.get(userId)?.fullName ?? UNKNOWN_INSTRUCTOR,
      email: instructorById.get(userId)?.email ?? '',
      courses: list.sort((a, b) => a.code.localeCompare(b.code)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalCourses: courses.length,
    totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
    withoutInstructor: courses.filter((c) => !assignmentsByCourse.has(c.id)).length,
    blocks,
    instructorEntries,
  };
}
