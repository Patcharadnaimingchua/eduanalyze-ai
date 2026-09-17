import { z } from 'zod';

// Mirrors Create{Faculty,Department,Program}Dto's name/code limits.
export const orgEntitySchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(255, 'ชื่อยาวเกิน 255 ตัวอักษร'),
  code: z.string().trim().min(1, 'กรุณากรอกรหัส').max(20, 'รหัสยาวเกิน 20 ตัวอักษร'),
});

export type OrgEntityFormValues = z.infer<typeof orgEntitySchema>;

const intField = (label: string) =>
  z.coerce.number({ invalid_type_error: `กรุณากรอก${label}` }).int(`${label}ต้องเป็นจำนวนเต็ม`);

// Mirrors CreateCurriculumDto.
export const curriculumSchema = z.object({
  version: z.string().trim().min(1, 'กรุณากรอกเวอร์ชัน').max(20, 'เวอร์ชันยาวเกิน 20 ตัวอักษร'),
  effectiveYear: intField('ปีที่เริ่มใช้'),
  totalCredits: intField('หน่วยกิตรวม').min(1, 'หน่วยกิตรวมต้องมากกว่า 0'),
  maxCreditsPerSemester: intField('หน่วยกิตสูงสุดต่อภาค').min(1, 'ต้องมากกว่า 0'),
  defaultAchievementThreshold: intField('เกณฑ์ผ่าน')
    .min(0, 'เกณฑ์ผ่านต้องอยู่ระหว่าง 0-100')
    .max(100, 'เกณฑ์ผ่านต้องอยู่ระหว่าง 0-100'),
});

export type CurriculumFormValues = z.infer<typeof curriculumSchema>;
