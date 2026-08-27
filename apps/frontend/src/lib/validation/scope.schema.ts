import { z } from 'zod';

export const scopeSchema = z.object({
  level: z.enum(['FACULTY', 'DEPARTMENT', 'PROGRAM'], {
    errorMap: () => ({ message: 'กรุณาเลือกระดับขอบเขต' }),
  }),
  targetId: z.string().uuid('กรุณาเลือกหน่วยงาน'),
});

export type ScopeFormValues = z.infer<typeof scopeSchema>;
