'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AuthSplitLayout } from './auth-split-layout';
import { ChangePasswordForm } from './change-password-form';

// Client-side gate only — reuses AuthContext's status (already populated
// by the silent refresh-on-mount built in F1), no middleware. Consistent
// with the access-token-never-in-a-cookie design: middleware can't
// inspect it anyway, so there's nothing a server-side check could add
// here that the client doesn't already resolve via /auth/refresh.
//
// Also the single choke point for the forced-password-change gate: every
// authenticated page renders through here, so checking
// user.mustChangePassword once — instead of a redirect to a dedicated
// route — covers every deep link and reload automatically. The real
// enforcement is on the backend (JwtAuthGuard); this is just so a blocked
// user sees a form instead of a page that 403s underneath them.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (user?.mustChangePassword) {
    return (
      <AuthSplitLayout>
        <ChangePasswordForm
          title="ตั้งรหัสผ่านใหม่"
          description="บัญชีนี้ยังใช้รหัสผ่านชั่วคราวอยู่ กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งานต่อ"
        />
      </AuthSplitLayout>
    );
  }

  return <>{children}</>;
}
