'use client';

import type { Role } from '@eduanalyze-ai/shared-types';
import { useAuth } from '@/lib/auth-context';

export const ROLE_LABEL_TH: Record<Role, string> = {
  STUDENT: 'นักศึกษา',
  INSTRUCTOR: 'อาจารย์',
  STAFF: 'เจ้าหน้าที่',
  ADMIN: 'ผู้ดูแลระบบ',
  SUPER_ADMIN: 'ผู้ดูแลระบบสูงสุด',
};

// Reproduces the inline-message role gate pattern copy-pasted across every
// STUDENT page (e.g. app/dashboard/page.tsx's `isStudent` check) as a
// shared component, for pages restricted to a role other than STUDENT.
// `role` accepts either one role or several (any-of) — e.g. /admin/users
// is reachable by both SUPER_ADMIN and ADMIN, unlike /admin/academic-years
// which is SUPER_ADMIN-only.
export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!allowedRoles.some((allowedRole) => user.roles.includes(allowedRole))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          หน้านี้สำหรับ{allowedRoles.map((allowedRole) => ROLE_LABEL_TH[allowedRole]).join('หรือ')}เท่านั้น
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
