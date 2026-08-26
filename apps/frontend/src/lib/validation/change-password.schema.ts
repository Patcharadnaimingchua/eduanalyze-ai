import { z } from 'zod';
import { passwordSchema } from './common';

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
