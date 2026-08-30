import { Prisma } from '@prisma/client';
import { calculateActualPloAchievement, CloContribution } from './calculate-actual-plo';

const d = (v: number | string) => new Prisma.Decimal(v);

function contribution(overrides: Partial<CloContribution> = {}): CloContribution {
  return {
    cloId: 'clo-1',
    actualCloScore: d(80),
    cloPloWeight: d(1),
    ...overrides,
  };
}

describe('calculateActualPloAchievement', () => {
  it('returns null/NO_EVIDENCE when no CLOs are mapped to the PLO at all', () => {
    const result = calculateActualPloAchievement([]);
    expect(result.score).toBeNull();
    expect(result.status).toBe('NO_EVIDENCE');
    expect(result.source).toBe('NO_EVIDENCE');
  });

  it('returns null/NO_EVIDENCE when every mapped CLO has no evidence', () => {
    const result = calculateActualPloAchievement([
      contribution({ cloId: 'clo-1', actualCloScore: null }),
      contribution({ cloId: 'clo-2', actualCloScore: null }),
    ]);
    expect(result.score).toBeNull();
    expect(result.status).toBe('NO_EVIDENCE');
    expect(result.coverage.totalCount).toBe(2);
    expect(result.coverage.validCount).toBe(0);
  });

  it('weight-averages actual CLO scores using CloPloMapping.weight, distinct from AssessmentCloMapping.weight', () => {
    // CLO-A: 90% at PLO-weight 1, CLO-B: 60% at PLO-weight 2
    // expected = (90*1 + 60*2) / (1+2) = 210/3 = 70
    const result = calculateActualPloAchievement([
      contribution({ cloId: 'clo-a', actualCloScore: d(90), cloPloWeight: d(1) }),
      contribution({ cloId: 'clo-b', actualCloScore: d(60), cloPloWeight: d(2) }),
    ]);
    expect(result.score!.toNumber()).toBe(70);
    expect(result.status).toBe('COMPLETE');
  });

  it('excludes a null-score (NO_EVIDENCE) CLO from the denominator, never treats it as 0', () => {
    // CLO-A has evidence (80%, weight 1); CLO-B has none — must not drag
    // the average down as if CLO-B scored 0.
    const result = calculateActualPloAchievement([
      contribution({ cloId: 'clo-a', actualCloScore: d(80), cloPloWeight: d(1) }),
      contribution({ cloId: 'clo-b', actualCloScore: null, cloPloWeight: d(5) }),
    ]);
    expect(result.score!.toNumber()).toBe(80); // not (80*1 + 0*5)/6
    expect(result.status).toBe('PARTIAL');
    expect(result.coverage.validCount).toBe(1);
    expect(result.coverage.totalCount).toBe(2);
  });

  it('reports COMPLETE only when every mapped CLO has evidence', () => {
    const result = calculateActualPloAchievement([
      contribution({ cloId: 'clo-a', actualCloScore: d(80) }),
      contribution({ cloId: 'clo-b', actualCloScore: d(70) }),
    ]);
    expect(result.status).toBe('COMPLETE');
  });

  it('does not require CloPloMapping weights to sum to 100', () => {
    const result = calculateActualPloAchievement([
      contribution({ cloId: 'clo-a', actualCloScore: d(100), cloPloWeight: d(7) }),
      contribution({ cloId: 'clo-b', actualCloScore: d(50), cloPloWeight: d(3) }),
    ]);
    // (100*7 + 50*3) / 10 = 850/10 = 85
    expect(result.score!.toNumber()).toBe(85);
  });
});
