import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div
      role="status"
      className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-6"
    >
      <span className="sr-only">กำลังโหลดหน้า กรุณารอสักครู่</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
