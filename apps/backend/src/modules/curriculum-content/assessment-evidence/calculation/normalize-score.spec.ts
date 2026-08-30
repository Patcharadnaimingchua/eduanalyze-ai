import { Prisma } from '@prisma/client';
import { normalizeScore, resolveEffectiveMax } from './normalize-score';

const d = (v: number | string) => new Prisma.Decimal(v);

describe('normalizeScore', () => {
  it('normalizes a mid-range score to a percent', () => {
    expect(normalizeScore(d(8), d(10)).toNumber()).toBe(80);
  });

  it('normalizes a full score to exactly 100', () => {
    expect(normalizeScore(d(20), d(20)).toNumber()).toBe(100);
  });

  it('normalizes a zero score to exactly 0', () => {
    expect(normalizeScore(d(0), d(20)).toNumber()).toBe(0);
  });

  it('keeps Decimal precision on values that are not exact in floating point', () => {
    // 1/3 * 100 is not exactly representable in IEEE-754 float — Decimal
    // must preserve full precision rather than truncating like a naive
    // `score / max * 100` in plain JS numbers would.
    const result = normalizeScore(d(1), d(3));
    expect(result.toFixed(10)).toBe('33.3333333333');
    expect(result).toBeInstanceOf(Prisma.Decimal);
  });

  it('throws when effectiveMax is zero', () => {
    expect(() => normalizeScore(d(5), d(0))).toThrow();
  });

  it('throws when effectiveMax is negative', () => {
    expect(() => normalizeScore(d(5), d(-10))).toThrow();
  });
});

describe('resolveEffectiveMax', () => {
  it('uses maxScoreOverride when present', () => {
    expect(resolveEffectiveMax(d(40), d(100)).toNumber()).toBe(40);
  });

  it('falls back to assessmentMaxScore when override is null', () => {
    expect(resolveEffectiveMax(null, d(100)).toNumber()).toBe(100);
  });

  it('treats an override of 0 as a real override, not a fallback trigger', () => {
    // Decimal(0) is falsy-looking but must not be treated as "absent" —
    // ?? only skips null/undefined, never 0. Documented here so a future
    // refactor to `||` doesn't silently reintroduce that bug.
    expect(resolveEffectiveMax(d(0), d(100)).toNumber()).toBe(0);
  });
});
