// The one sentence every list uses to say where the reader is. `unit` names what
// the total counts: "คน" for lists of people, "รายการ" for everything else.
export type PaginationUnit = 'คน' | 'รายการ';

export function paginationSummary(
  rangeStart: number,
  rangeEnd: number,
  total: number,
  unit: PaginationUnit = 'รายการ',
): string {
  if (total === 0) return 'ไม่พบรายการ';
  const n = (value: number) => value.toLocaleString('th-TH');
  return `แสดง ${n(rangeStart)}–${n(rangeEnd)} จาก ${n(total)} ${unit}`;
}
