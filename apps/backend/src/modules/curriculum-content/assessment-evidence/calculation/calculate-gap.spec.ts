import { Prisma } from '@prisma/client';
import { calculateGap } from './calculate-gap';

const d = (v: number | string) => new Prisma.Decimal(v);

describe('calculateGap', () => {
  it('converts actualCloPercent to the 1-5 scale and subtracts from self-assessment', () => {
    // actual 80% -> 4.0 on the 5-scale; self-assessment 5 -> gap = 1.0
    const gap = calculateGap(5, d(80));
    expect(gap!.toNumber()).toBe(1);
  });

  it('returns a negative gap when self-assessment underestimates actual achievement', () => {
    // actual 100% -> 5.0; self-assessment 3 -> gap = -2.0
    const gap = calculateGap(3, d(100));
    expect(gap!.toNumber()).toBe(-2);
  });

  it('returns zero when self-assessment matches actual achievement exactly', () => {
    // actual 60% -> 3.0; self-assessment 3 -> gap = 0
    const gap = calculateGap(3, d(60));
    expect(gap!.toNumber()).toBe(0);
  });

  it('returns null when self-assessment is missing', () => {
    expect(calculateGap(null, d(80))).toBeNull();
  });

  it('returns null when actual achievement is missing (NO_EVIDENCE)', () => {
    expect(calculateGap(4, null)).toBeNull();
  });

  it('returns null when both sides are missing', () => {
    expect(calculateGap(null, null)).toBeNull();
  });

  it('keeps Decimal precision on a non-exact conversion', () => {
    // 82% -> 4.1 exactly on the 5-scale; self-assessment 5 -> gap = 0.9
    const gap = calculateGap(5, d(82));
    expect(gap!.toFixed(4)).toBe('0.9000');
  });
});
