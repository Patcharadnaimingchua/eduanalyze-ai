import { z } from 'zod';

// Mirrors CreateAcademicYearDto's @Min(2500) @Max(2700) (Buddhist Era).
export const academicYearSchema = z.object({
  year: z.coerce
    .number({ invalid_type_error: 'กรุณากรอกปีการศึกษา' })
    .int('ปีการศึกษาต้องเป็นจำนวนเต็ม')
    .min(2500, 'ปีการศึกษาต้องอยู่ระหว่าง 2500-2700 (พ.ศ.)')
    .max(2700, 'ปีการศึกษาต้องอยู่ระหว่าง 2500-2700 (พ.ศ.)'),
});

export type AcademicYearFormValues = z.infer<typeof academicYearSchema>;
