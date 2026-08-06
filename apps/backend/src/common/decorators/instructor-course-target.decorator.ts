import { SetMetadata } from '@nestjs/common';

export interface InstructorCourseSource {
  from: 'param' | 'body' | 'query';
  key: string;
}

export const INSTRUCTOR_COURSE_TARGET_KEY = 'instructorCourseTarget';

// Marks a route as requiring the requester to be directly assigned
// (CourseInstructor) to the courseId found at the given source — a flat
// membership check, not a hierarchical one, see InstructorGuard.
export const InstructorCourseTarget = (source: InstructorCourseSource) =>
  SetMetadata(INSTRUCTOR_COURSE_TARGET_KEY, source);
