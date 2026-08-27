import { z } from 'zod';

// Mirrors CreatePrerequisiteDto — courseId comes from page context, not
// this form. groupId is reserved/unused (backend doesn't evaluate it yet).
export const prerequisiteSchema = z.object({
  prerequisiteCourseId: z.string().uuid('กรุณาเลือกวิชาที่เป็นตัวก่อน'),
});

export type PrerequisiteFormValues = z.infer<typeof prerequisiteSchema>;
