'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Client-side gate only — reuses AuthContext's status (already populated
// by the silent refresh-on-mount built in F1), no middleware. Consistent
// with the access-token-never-in-a-cookie design: middleware can't
// inspect it anyway, so there's nothing a server-side check could add
// here that the client doesn't already resolve via /auth/refresh.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
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

  return <>{children}</>;
}
