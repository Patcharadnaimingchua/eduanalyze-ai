import { z } from 'zod';
import { passwordSchema } from './common';

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
