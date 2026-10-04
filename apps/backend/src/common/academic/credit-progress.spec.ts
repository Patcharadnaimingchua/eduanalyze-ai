import { creditProgressPercent, creditsRemaining } from './credit-progress';

describe('creditsRemaining', () => {
  it('is the shortfall when credits are incomplete', () => {
    expect(creditsRemaining(130, 96)).toBe(34);
    expect(creditsRemaining(130, 0)).toBe(130);
  });

  it('is 0 when credits match the requirement exactly', () => {
    expect(creditsRemaining(130, 130)).toBe(0);
  });

  it('never goes negative when credits exceed the requirement', () => {
    expect(creditsRemaining(130, 140)).toBe(0);
  });

  it('is 0 when the curriculum requires 0 credits', () => {
    expect(creditsRemaining(0, 0)).toBe(0);
    expect(creditsRemaining(0, 12)).toBe(0);
  });
});

describe('creditProgressPercent', () => {
  it('is the plain percentage when credits are incomplete', () => {
    expect(creditProgressPercent(96, 130)).toBeCloseTo(73.846, 3);
    expect(creditProgressPercent(0, 130)).toBe(0);
  });

  it('is exactly 100 when credits match the requirement', () => {
    expect(creditProgressPercent(130, 130)).toBe(100);
  });

  it('is capped at 100 when credits exceed the requirement', () => {
    expect(creditProgressPercent(140, 130)).toBe(100);
    expect(creditProgressPercent(1000, 130)).toBe(100);
  });

  it('is 0 (not NaN or Infinity) when the curriculum requires 0 credits', () => {
    expect(creditProgressPercent(0, 0)).toBe(0);
    expect(creditProgressPercent(12, 0)).toBe(0);
  });
});
