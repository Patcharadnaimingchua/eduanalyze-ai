import { countShare, creditShare, ringTick, showAchievementRing } from './progress-ring-geometry';

describe('showAchievementRing', () => {
  it('needs at least 5 graded people and a real percent', () => {
    expect(showAchievementRing(4, 80)).toBe(false);
    expect(showAchievementRing(5, 80)).toBe(true);
    expect(showAchievementRing(30, 0)).toBe(true);
    expect(showAchievementRing(30, null)).toBe(false);
    expect(showAchievementRing(30, Number.NaN)).toBe(false);
  });
});

describe('creditShare', () => {
  it('is the share of the rule, capped at 100', () => {
    expect(creditShare(30, 60)).toBe(50);
    expect(creditShare(90, 60)).toBe(100);
    expect(creditShare(0, 60)).toBe(0);
  });
  it('has no ring without a usable rule', () => {
    expect(creditShare(10, null)).toBeNull();
    expect(creditShare(10, undefined)).toBeNull();
    expect(creditShare(10, 0)).toBeNull();
  });
});

describe('countShare', () => {
  it('is part over whole, null for an empty whole', () => {
    expect(countShare(3, 4)).toBe(75);
    expect(countShare(0, 0)).toBeNull();
    expect(countShare(5, 4)).toBe(100);
  });
});

describe('ringTick', () => {
  it('puts 0 at the top and 25 on the right of the ring', () => {
    const top = ringTick(100, 10, 0);
    expect(top.from.x).toBe(50);
    expect(top.to.x).toBe(50);
    expect(top.to.y).toBeLessThan(top.from.y);
    const right = ringTick(100, 10, 25);
    expect(right.from.y).toBe(50);
    expect(right.to.x).toBeGreaterThan(right.from.x);
  });
});
