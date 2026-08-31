import { z } from 'zod';

// Mirrors CreateAssessmentCloMappingDto — weight > 0 (does not need to sum
// to 100 across a CLO's mappings, see backend DTO comment).
// maxScoreOverride is optional; an empty input is normalized to undefined
// (never NaN) so "omit to use the assessment's own maxScore" holds.
export const assessmentCloMappingSchema = z.object({
  cloId: z.string().uuid('กรุณาเลือก CLO'),
  weight: z.coerce
    .number({ invalid_type_error: 'กรุณากรอกน้ำหนักคะแนน' })
    .min(0.01, 'น้ำหนักคะแนนต้องมากกว่า 0'),
  maxScoreOverride: z
    .union([z.coerce.number().min(0.01, 'คะแนนเต็มต้องมากกว่า 0'), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : value)),
});

export type AssessmentCloMappingFormValues = z.infer<typeof assessmentCloMappingSchema>;
