import { z } from 'zod';

// Mirrors TwoFactorEnableDto — exactly 6 digits.
export const twoFactorEnableSchema = z.object({
  code: z
    .string()
    .length(6, 'กรุณากรอกรหัส 6 หลักจากแอป Authenticator')
    .regex(/^\d{6}$/, 'กรอกได้เฉพาะตัวเลข'),
});
export type TwoFactorEnableFormValues = z.infer<typeof twoFactorEnableSchema>;

// Mirrors TwoFactorDisableDto.
export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
});
export type TwoFactorDisableFormValues = z.infer<typeof twoFactorDisableSchema>;

// Deliberately loose (not length-constrained like enable's 6 digits) —
// accepts either a live TOTP code or a recovery code ("XXXX-XXXX"), same
// as TwoFactorVerifyDto on the backend.
export const twoFactorVerifySchema = z.object({
  code: z.string().min(1, 'กรุณากรอกรหัสยืนยัน'),
});
export type TwoFactorVerifyFormValues = z.infer<typeof twoFactorVerifySchema>;
