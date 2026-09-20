'use client';

import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

// What a column's accessor may return. Domain enums are deliberately NOT
// handled here — a caller ranks them itself (e.g. GRADE_OPTIONS.indexOf)
// so ordering stays with the domain, not in this hook.
type SortValue = string | number | null | undefined;

export interface SortControl {
  active: boolean;
  direction: SortDirection;
  onToggle: () => void;
}

function isEmpty(value: SortValue): boolean {
  return value === null || value === undefined || value === '';
}

function compare(a: SortValue, b: SortValue, direction: SortDirection): number {
  // Empty values sort last in BOTH directions — a row with no grade is
  // missing data, not a value that should lead the descending view.
  if (isEmpty(a) && isEmpty(b)) return 0;
  if (isEmpty(a)) return 1;
  if (isEmpty(b)) return -1;

  const factor = direction === 'asc' ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * factor;
  }
  // 'th' locale: Thai names order incorrectly under a plain < comparison.
  return String(a).localeCompare(String(b), 'th') * factor;
}

export function useTableSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => SortValue>,
  initial?: { key: K; direction?: SortDirection },
) {
  const [sortKey, setSortKey] = useState<K | null>(initial?.key ?? null);
  const [direction, setDirection] = useState<SortDirection>(initial?.direction ?? 'asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const accessor = accessors[sortKey];
    // Array.prototype.sort is stable, so equal rows keep their source order.
    return [...rows].sort((a, b) => compare(accessor(a), accessor(b), direction));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, direction]);

  function sortProps(key: K): SortControl {
    return {
      active: sortKey === key,
      direction: sortKey === key ? direction : 'asc',
      onToggle: () => {
        if (sortKey === key) {
          setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
          setSortKey(key);
          setDirection('asc');
        }
      },
    };
  }

  return { sorted, sortKey, direction, sortProps };
}
