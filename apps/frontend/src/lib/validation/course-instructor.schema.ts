import { z } from 'zod';

// Mirrors CreateCourseInstructorDto — courseId comes from page context,
// not this form.
export const courseInstructorSchema = z.object({
  userId: z.string().uuid('กรุณาเลือกอาจารย์ผู้สอน'),
});

export type CourseInstructorFormValues = z.infer<typeof courseInstructorSchema>;
