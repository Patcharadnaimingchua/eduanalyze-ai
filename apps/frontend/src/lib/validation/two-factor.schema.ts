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

// Login page's two explicit modes (OtpInput vs recovery-code text field) —
// stricter than the loose combined schema above, one per mode.
export const twoFactorVerifyTotpSchema = z.object({
  code: z.string().length(6, 'กรุณากรอกรหัส 6 หลัก').regex(/^\d{6}$/, 'กรอกได้เฉพาะตัวเลข'),
});
export type TwoFactorVerifyTotpFormValues = z.infer<typeof twoFactorVerifyTotpSchema>;

// Mirrors RECOVERY_CODE_FORMAT (apps/backend/src/common/util/crypto.util.ts)
// case-insensitively.
export const twoFactorVerifyRecoverySchema = z.object({
  code: z
    .string()
    .regex(/^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/, 'รูปแบบต้องเป็น XXXX-XXXX'),
});
export type TwoFactorVerifyRecoveryFormValues = z.infer<typeof twoFactorVerifyRecoverySchema>;
