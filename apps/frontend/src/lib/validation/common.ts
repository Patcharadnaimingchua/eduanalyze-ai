import { z } from 'zod';

// Mirrors RegisterDto/LoginDto etc.'s class-validator rules on the
// backend — instant client-side feedback only, the backend stays the
// source of truth and re-validates independently.
export const emailSchema = z.string().email('อีเมลไม่ถูกต้อง');

export const passwordSchema = z
  .string()
  .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    'รหัสผ่านต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลขอย่างน้อยอย่างละ 1 ตัว',
  );

export const otpCodeSchema = z
  .string()
  .length(6, 'รหัส OTP ต้องมี 6 หลัก')
  .regex(/^\d{6}$/, 'รหัส OTP ต้องเป็นตัวเลข 6 หลัก');
