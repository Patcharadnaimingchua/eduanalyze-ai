import { z } from 'zod';
import { emailSchema } from './common';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
