import { z } from 'zod';

// Mirrors CreateAssessmentDefinitionDto (title/kind free text, maxScore >
// 0, missingScorePolicy optional/defaults to EXCLUDE server-side).
// courseId/semesterId are supplied by the caller (selected course +
// semester <Select>), not entered as free text here.
export const assessmentDefinitionSchema = z.object({
  title: z.string().trim().min(1, 'กรุณากรอกชื่อการประเมิน'),
  kind: z.string().trim().min(1, 'กรุณากรอกประเภท (เช่น Quiz, Exam, Assignment)'),
  maxScore: z.coerce
    .number({ invalid_type_error: 'กรุณากรอกคะแนนเต็ม' })
    .min(0.01, 'คะแนนเต็มต้องมากกว่า 0'),
  semesterId: z.string().uuid('กรุณาเลือกภาคเรียน'),
});

export type AssessmentDefinitionFormValues = z.infer<typeof assessmentDefinitionSchema>;
