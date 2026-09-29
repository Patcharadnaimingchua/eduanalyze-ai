import type { Role } from '@eduanalyze-ai/shared-types';

// The backend denies a STAFF/ADMIN with no UserScope everywhere, and never
// requires a scope when a role is assigned — so the UI has to surface it.
// SUPER_ADMIN bypasses scope, and instructors are scoped by course
// assignment rather than UserScope rows.
export function roleNeedsScope(roles: Role[]): boolean {
  return !roles.includes('SUPER_ADMIN') && (roles.includes('STAFF') || roles.includes('ADMIN'));
}

export const MISSING_SCOPE_WARNING =
  'บทบาทเจ้าหน้าที่/ผู้ดูแลระบบจะเข้าถึงข้อมูลใดไม่ได้จนกว่าจะกำหนดขอบเขตความรับผิดชอบ';
