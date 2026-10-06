import { formatPercent } from './format-percent';

describe('formatPercent', () => {
  it('rounds to a whole percent', () => {
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(66.6)).toBe('67%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('shows the no-data label for missing or broken values', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(Number.NaN)).toBe('—');
    expect(formatPercent(null, 'ยังไม่มีข้อมูล')).toBe('ยังไม่มีข้อมูล');
  });
});
