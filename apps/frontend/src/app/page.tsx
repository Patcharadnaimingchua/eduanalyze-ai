'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, status, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-3xl font-bold">EduAnalyzeAI</h1>

      {status === 'loading' && <Skeleton className="h-4 w-48" />}

      {status === 'authenticated' && user && (
        <div className="flex flex-col items-center gap-3">
          <p>
            เข้าสู่ระบบในชื่อ <span className="font-medium">{user.fullName}</span> ({user.email})
          </p>
          <Button variant="outline" onClick={() => logout()}>
            ออกจากระบบ
          </Button>
        </div>
      )}

      {status === 'unauthenticated' && (
        <div className="flex gap-3">
          <Link href="/login">
            <Button>เข้าสู่ระบบ</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">สมัครสมาชิก</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
