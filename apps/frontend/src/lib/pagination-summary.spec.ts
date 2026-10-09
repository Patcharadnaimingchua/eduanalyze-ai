import { paginationSummary } from './pagination-summary';

describe('paginationSummary', () => {
  it('names the range and the total with the unit', () => {
    expect(paginationSummary(1, 10, 42, 'คน')).toBe('แสดง 1–10 จาก 42 คน');
  });

  it('counts รายการ unless told otherwise', () => {
    expect(paginationSummary(11, 20, 35)).toBe('แสดง 11–20 จาก 35 รายการ');
  });

  it('groups thousands', () => {
    expect(paginationSummary(1, 25, 1420, 'คน')).toBe('แสดง 1–25 จาก 1,420 คน');
  });

  it('says nothing was found for an empty list', () => {
    expect(paginationSummary(0, 0, 0, 'คน')).toBe('ไม่พบรายการ');
  });
});
