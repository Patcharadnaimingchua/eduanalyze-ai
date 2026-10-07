'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { pageWindow } from './page-window';

export const PAGE_SIZES = [10, 25, 50] as const;

// The 44px counterpart of ui/pagination (which other roles share, so it is not
// touched). The line says what the total counts, and nothing else on the page
// repeats "จาก N".
export function StaffPagination({
  page,
  pageCount,
  total,
  rangeStart,
  rangeEnd,
  unit,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Readonly<{
  page: number;
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  unit: string;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}>) {
  if (total === 0) return null;
  const nav = 'h-11 min-w-11 px-3';

  return (
    <div className="flex flex-col gap-3 pt-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p>
          แสดงรายการที่ {rangeStart} ถึง {rangeEnd} จากทั้งหมด {total} {unit}
        </p>
        <label className="flex items-center gap-2">
          แสดงแถว
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-11 w-24" aria-label="จำนวนแถวต่อหน้า">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      {pageCount > 1 && (
        <nav aria-label="เลือกหน้า" className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={nav}
            aria-label="หน้าก่อนหน้า"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          {pageWindow(page, pageCount).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1">
                …
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant={p === page ? 'default' : 'outline'}
                className={cn(nav, 'tabular-nums')}
                aria-label={`หน้า ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            className={nav}
            aria-label="หน้าถัดไป"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
