import { formatPloScore } from './admin-curriculum-quality';
import { formatFiveScale } from './five-scale';

// The PLO table writes the scale's top as formatValue(100), so each formatter must
// give the matching top for the precision it uses.
describe('five-point scale formatters', () => {
  it('formatFiveScale shows one decimal, so the top is 5.0', () => {
    expect(formatFiveScale(100)).toBe('5.0');
    expect(formatFiveScale(50)).toBe('2.5');
  });

  it('formatPloScore shows two decimals, so the top is 5.00', () => {
    expect(formatPloScore(100)).toBe('5.00');
  });

  it('both show the no-data label for null', () => {
    expect(formatFiveScale(null)).toBe('—');
    expect(formatPloScore(null, 'ไม่มีข้อมูล')).toBe('ไม่มีข้อมูล');
  });
});
