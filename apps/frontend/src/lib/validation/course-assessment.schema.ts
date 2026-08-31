import { z } from 'zod';

// Mirrors CreateCourseAssessmentDto/UpdateCourseAssessmentDto. The form,
// API, and database all use the same discrete 1-5 self-assessment score.
export const courseAssessmentSchema = z.object({
  cloScores: z
    .array(
      z.object({
        cloId: z.string().uuid(),
        score: z.number().int().min(1).max(5),
      }),
    )
    .min(1, 'กรุณาให้คะแนนอย่างน้อย 1 CLO'),
  comment: z.string().max(2000).optional(),
});

export type CourseAssessmentFormValues = z.infer<typeof courseAssessmentSchema>;
