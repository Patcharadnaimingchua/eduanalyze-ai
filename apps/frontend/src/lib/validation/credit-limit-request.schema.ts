import { z } from 'zod';

export const creditLimitRequestSchema = z.object({
  type: z.enum(['EXCEED_MAX', 'BELOW_MIN'], { required_error: 'กรุณาเลือกช่วงหน่วยกิตที่ต้องการ' }),
  reason: z.string().min(1, 'กรุณาระบุเหตุผลสั้นๆ').max(255, 'เหตุผลยาวเกินไป'),
});

export type CreditLimitRequestFormValues = z.infer<typeof creditLimitRequestSchema>;
