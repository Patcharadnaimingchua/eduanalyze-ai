'use client';

import { useEffect, useRef, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

// Client-side paging. `resetKey` is anything that changes the meaning of
// the list (search text, active filter, sort column) — when it changes the
// view jumps back to page 1, because staying on page 3 of a freshly
// re-sorted list shows an arbitrary middle slice and reads as broken.
// A plain refetch must NOT be a resetKey: editing a grade would then bounce
// the user back to page 1 every time.
export function usePagination<T>(
  rows: T[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  resetKey?: unknown,
) {
  const [page, setPage] = useState(1);
  const prevResetKeyRef = useRef(resetKey);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (resetKey !== undefined && resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      setPage(1);
    }
  }, [resetKey]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  // Clamped here as well as in the effect above: deleting the last row of
  // the last page shrinks pageCount in the same render, and without this
  // the table would flash empty before the effect catches up.
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return {
    page: safePage,
    pageCount,
    pageRows,
    setPage,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: start + pageRows.length,
  };
}
