import { z } from 'zod';

// Mirrors CreateCourseAssessmentDto/UpdateCourseAssessmentDto — cloScores
// keyed by real cloId (never free text, options come from GET /clos),
// score 1-5, comment optional.
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
