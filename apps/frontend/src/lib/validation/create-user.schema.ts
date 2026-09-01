import { z } from 'zod';

// Mirrors CreateUserDto — role:STUDENT is never an option here (self-
// register only), and role:SUPER_ADMIN is never an option either
// (advisor feedback — see plan file "เรื่องที่ 2": SUPER_ADMIN is never
// creatable via API, backend rejects it with 403 unconditionally).
// scopeLevel/scopeTargetId are optional at the schema level and enforced
// conditionally below, because whether scope is required depends on the
// chosen role (STAFF/ADMIN need one to do anything at all; INSTRUCTOR
// doesn't use UserScope) — see CreateUserForm for the UI side of this.
export const createUserSchema = z
  .object({
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล').max(255),
    role: z.enum(['INSTRUCTOR', 'STAFF', 'ADMIN'], {
      errorMap: () => ({ message: 'กรุณาเลือกบทบาท' }),
    }),
    scopeLevel: z.enum(['FACULTY', 'DEPARTMENT', 'PROGRAM']).optional(),
    scopeTargetId: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const scopeRequired = values.role === 'STAFF' || values.role === 'ADMIN';
    if (!scopeRequired) return;

    if (!values.scopeLevel) {
      ctx.addIssue({
        code: 'custom',
        path: ['scopeLevel'],
        message: 'กรุณาเลือกระดับขอบเขตความรับผิดชอบ',
      });
    }
    if (!values.scopeTargetId) {
      ctx.addIssue({
        code: 'custom',
        path: ['scopeTargetId'],
        message: 'กรุณาเลือกหน่วยงาน',
      });
    }
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
