import { Prisma } from '@prisma/client';
import { calculateActualCloAchievement, CloEvidenceItem } from './calculate-actual-clo';

const d = (v: number | string) => new Prisma.Decimal(v);

function item(overrides: Partial<CloEvidenceItem> = {}): CloEvidenceItem {
  return {
    score: d(8),
    status: 'GRADED',
    weight: d(1),
    maxScoreOverride: null,
    assessmentMaxScore: d(10),
    missingScorePolicy: 'EXCLUDE',
    ...overrides,
  };
}

describe('calculateActualCloAchievement', () => {
  it('returns null/NO_EVIDENCE when there is no evidence at all', () => {
    const result = calculateActualCloAchievement([]);
    expect(result.score).toBeNull();
    expect(result.status).toBe('NO_EVIDENCE');
    expect(result.source).toBe('NO_EVIDENCE');
    expect(result.coverage).toEqual({
      validCount: 0,
      totalCount: 0,
      validWeight: d(0),
      totalWeight: d(0),
    });
  });

  it('computes a single graded item as its normalized percent', () => {
    const result = calculateActualCloAchievement([item({ score: d(8), assessmentMaxScore: d(10) })]);
    expect(result.score!.toNumber()).toBe(80);
    expect(result.status).toBe('COMPLETE');
    expect(result.source).toBe('EVIDENCE_BASED');
  });

  it('handles a zero score as real evidence, not as missing', () => {
    const result = calculateActualCloAchievement([item({ score: d(0) })]);
    expect(result.score!.toNumber()).toBe(0);
    expect(result.status).toBe('COMPLETE');
    expect(result.source).toBe('EVIDENCE_BASED');
  });

  it('weight-averages multiple graded items correctly, weights not summing to 100', () => {
    // item A: 100% at weight 1, item B: 50% at weight 3
    // expected = (100*1 + 50*3) / (1+3) = 250/4 = 62.5
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(1) }),
      item({ score: d(5), assessmentMaxScore: d(10), weight: d(3) }),
    ]);
    expect(result.score!.toNumber()).toBe(62.5);
    expect(result.status).toBe('COMPLETE');
  });

  it('respects maxScoreOverride instead of the assessment default maxScore', () => {
    // A 100-point assessment, but this CLO's slice is only worth 40.
    const result = calculateActualCloAchievement([
      item({ score: d(20), assessmentMaxScore: d(100), maxScoreOverride: d(40) }),
    ]);
    expect(result.score!.toNumber()).toBe(50); // 20/40 * 100
  });

  it('excludes PENDING items entirely (not counted, not zeroed)', () => {
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(1) }),
      item({ status: 'PENDING', score: null, weight: d(1) }),
    ]);
    expect(result.score!.toNumber()).toBe(100); // only the graded item counts
    expect(result.status).toBe('PARTIAL'); // but coverage reflects the pending one
    expect(result.coverage.validCount).toBe(1);
    expect(result.coverage.totalCount).toBe(2);
  });

  it('ABSENT + EXCLUDE policy: excluded entirely, like PENDING', () => {
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(1) }),
      item({ status: 'ABSENT', score: null, weight: d(1), missingScorePolicy: 'EXCLUDE' }),
    ]);
    expect(result.score!.toNumber()).toBe(100);
    expect(result.status).toBe('PARTIAL');
    expect(result.coverage.validCount).toBe(1);
  });

  it('ABSENT + TREAT_AS_ZERO policy: counts as 0, included in denominator', () => {
    // item A: 100% weight 1, item B: absent/zero weight 1
    // expected = (100*1 + 0*1) / (1+1) = 50
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(1) }),
      item({ status: 'ABSENT', score: null, weight: d(1), missingScorePolicy: 'TREAT_AS_ZERO' }),
    ]);
    expect(result.score!.toNumber()).toBe(50);
    expect(result.status).toBe('COMPLETE'); // both items counted, so full coverage
    expect(result.coverage.validCount).toBe(2);
    expect(result.coverage.totalCount).toBe(2);
  });

  it('EXCUSED items are excluded entirely regardless of missingScorePolicy', () => {
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(1) }),
      item({ status: 'EXCUSED', score: null, weight: d(1), missingScorePolicy: 'TREAT_AS_ZERO' }),
    ]);
    expect(result.score!.toNumber()).toBe(100);
    expect(result.status).toBe('PARTIAL');
    expect(result.coverage.validCount).toBe(1);
  });

  it('returns NO_EVIDENCE (not 0) when every item is excluded', () => {
    const result = calculateActualCloAchievement([
      item({ status: 'PENDING', score: null }),
      item({ status: 'EXCUSED', score: null }),
      item({ status: 'ABSENT', score: null, missingScorePolicy: 'EXCLUDE' }),
    ]);
    expect(result.score).toBeNull();
    expect(result.status).toBe('NO_EVIDENCE');
    expect(result.coverage.totalCount).toBe(3);
    expect(result.coverage.validCount).toBe(0);
  });

  it('reports PARTIAL with correct coverage fractions when some evidence is missing', () => {
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(2) }),
      item({ status: 'PENDING', score: null, weight: d(1) }),
      item({ status: 'PENDING', score: null, weight: d(1) }),
    ]);
    expect(result.status).toBe('PARTIAL');
    expect(result.coverage.validCount).toBe(1);
    expect(result.coverage.totalCount).toBe(3);
    expect(result.coverage.validWeight.toNumber()).toBe(2);
    expect(result.coverage.totalWeight.toNumber()).toBe(4);
  });

  it('scopes independently per CLO — same assessment mapped to two CLOs with different weights/scores', () => {
    // Simulates one AssessmentDefinition mapped to CLO-A (weight 1, this
    // student scored 8/10) and CLO-B (weight 3, scored 4/10) — the
    // service builds a separate item list per CLO; this test proves the
    // pure function has no hidden cross-CLO state.
    const cloAResult = calculateActualCloAchievement([
      item({ score: d(8), assessmentMaxScore: d(10), weight: d(1) }),
    ]);
    const cloBResult = calculateActualCloAchievement([
      item({ score: d(4), assessmentMaxScore: d(10), weight: d(3) }),
    ]);
    expect(cloAResult.score!.toNumber()).toBe(80);
    expect(cloBResult.score!.toNumber()).toBe(40);
  });

  it('keeps Decimal precision across a weighted average that is not exact in floating point', () => {
    // (100*1 + 0*2) / 3 = 33.333... — must not truncate to 33 or drift
    // like naive float division would.
    const result = calculateActualCloAchievement([
      item({ score: d(10), assessmentMaxScore: d(10), weight: d(1) }),
      item({ score: d(0), assessmentMaxScore: d(10), weight: d(2) }),
    ]);
    expect(result.score!.toFixed(10)).toBe('33.3333333333');
  });
});
