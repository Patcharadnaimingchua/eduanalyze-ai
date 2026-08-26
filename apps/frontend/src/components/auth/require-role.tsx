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
export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!user.roles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">หน้านี้สำหรับ{ROLE_LABEL_TH[role]}เท่านั้น</p>
      </div>
    );
  }

  return <>{children}</>;
}
