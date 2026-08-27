import { z } from 'zod';

// Mirrors CreateCourseCategoryDto — curriculumId comes from page context,
// not this form.
export const courseCategorySchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อหมวดวิชา').max(255, 'ชื่อหมวดวิชายาวเกินไป'),
  code: z.string().max(20, 'รหัสหมวดวิชายาวเกินไป').optional().or(z.literal('')),
});

export type CourseCategoryFormValues = z.infer<typeof courseCategorySchema>;
