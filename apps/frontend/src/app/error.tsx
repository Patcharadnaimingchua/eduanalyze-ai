'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

// The error's own message is never shown: it is written for developers, and a
// server-side one is already replaced by Next with a digest.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main role="alert" className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={AlertTriangle}
        description={
          <span className="block max-w-md space-y-1">
            <span className="block font-semibold text-primary">เกิดข้อผิดพลาดที่ไม่คาดคิด</span>
            <span className="block">
              ขออภัยในความไม่สะดวก ระบบไม่สามารถแสดงหน้านี้ได้ในขณะนี้ กรุณาลองอีกครั้ง
              หากยังพบปัญหา โปรดแจ้งผู้ดูแลระบบ
            </span>
          </span>
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={reset}>
              ลองอีกครั้ง
            </Button>
            <Button asChild variant="outline">
              <Link href="/">กลับหน้าแรก</Link>
            </Button>
          </div>
        }
      />
    </main>
  );
}
