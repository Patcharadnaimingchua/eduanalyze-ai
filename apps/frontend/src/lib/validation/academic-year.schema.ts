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

// startYear สูงสุด 2697 เพื่อให้ startYear+3 ไม่เกิน 2700 (ตรงกับ CreateAcademicYearDto's @Max(2700))
export const bulkAcademicYearSchema = z.object({
  startYear: z.coerce
    .number({ invalid_type_error: 'กรุณากรอกปีเริ่มต้น' })
    .int('ปีต้องเป็นจำนวนเต็ม')
    .min(2500, 'ปีต้องอยู่ระหว่าง 2500-2697 (พ.ศ.)')
    .max(2697, 'ปีต้องอยู่ระหว่าง 2500-2697 (พ.ศ.) เพื่อให้สร้างครบ 4 ปีได้ไม่เกิน 2700'),
});

export type BulkAcademicYearFormValues = z.infer<typeof bulkAcademicYearSchema>;
