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

export const MAX_BULK_YEARS = 10;

// startYear + yearCount - 1 must stay within CreateAcademicYearDto's @Max(2700).
export const bulkAcademicYearSchema = z
  .object({
    startYear: z.coerce
      .number({ invalid_type_error: 'กรุณากรอกปีเริ่มต้น' })
      .int('ปีต้องเป็นจำนวนเต็ม')
      .min(2500, 'ปีต้องอยู่ระหว่าง 2500-2700 (พ.ศ.)')
      .max(2700, 'ปีต้องอยู่ระหว่าง 2500-2700 (พ.ศ.)'),
    yearCount: z.coerce
      .number({ invalid_type_error: 'กรุณากรอกจำนวนปี' })
      .int('จำนวนปีต้องเป็นจำนวนเต็ม')
      .min(1, 'อย่างน้อย 1 ปี')
      .max(MAX_BULK_YEARS, `สร้างได้ไม่เกิน ${MAX_BULK_YEARS} ปีต่อครั้ง`),
  })
  .refine((v) => v.startYear + v.yearCount - 1 <= 2700, {
    path: ['yearCount'],
    message: 'ปีสุดท้ายต้องไม่เกิน 2700 (พ.ศ.) ลดจำนวนปีหรือปีเริ่มต้น',
  });

export type BulkAcademicYearFormValues = z.infer<typeof bulkAcademicYearSchema>;
