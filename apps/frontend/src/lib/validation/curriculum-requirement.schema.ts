import { z } from 'zod';

// Mirrors CreateCurriculumRequirementDto — curriculumId/categoryId come
// from page context, not this form.
export const curriculumRequirementSchema = z.object({
  minCredits: z.coerce
    .number({ invalid_type_error: 'กรุณากรอกหน่วยกิตขั้นต่ำ' })
    .int('หน่วยกิตขั้นต่ำต้องเป็นจำนวนเต็ม')
    .min(0, 'หน่วยกิตขั้นต่ำต้องไม่ติดลบ'),
  minCourses: z.coerce
    .number()
    .int('จำนวนวิชาขั้นต่ำต้องเป็นจำนวนเต็ม')
    .min(0, 'จำนวนวิชาขั้นต่ำต้องไม่ติดลบ')
    .optional(),
});

export type CurriculumRequirementFormValues = z.infer<typeof curriculumRequirementSchema>;
