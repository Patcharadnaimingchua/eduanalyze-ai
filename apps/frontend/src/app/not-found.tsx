import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={FileQuestion}
        description={
          <span className="block max-w-md space-y-1">
            <span className="block font-semibold text-primary">ไม่พบหน้าที่ต้องการ</span>
            <span className="block">
              หน้านี้อาจถูกย้าย ถูกลบ หรือที่อยู่ที่ระบุไม่ถูกต้อง กรุณาตรวจสอบที่อยู่อีกครั้ง
            </span>
          </span>
        }
        action={
          <Button asChild>
            <Link href="/">กลับหน้าแรก</Link>
          </Button>
        }
      />
    </main>
  );
}
