import type {
  CohortPloAchievementReport,
  LowestCloEntry,
  RadarPoint,
} from '@eduanalyze-ai/shared-types';
import {
  gpaBarPercent,
  hasAnyPloData,
  hasLittleData,
  lowestPlos,
  sortCohorts,
  summarizeLowestClos,
} from './admin-curriculum-quality';

const plo = (code: string, value: number | null): RadarPoint => ({
  ploId: code,
  code,
  name: code,
  value,
});

describe('lowestPlos', () => {
  it('returns the lowest three, lowest first', () => {
    const radar = [
      plo('PLO1', 82),
      plo('PLO2', 70),
      plo('PLO3', 61),
      plo('PLO4', 86),
      plo('PLO5', 64),
    ];
    expect(lowestPlos(radar).map((p) => p.code)).toEqual(['PLO3', 'PLO5', 'PLO2']);
  });
  it('leaves out a PLO with no data instead of ranking it lowest', () => {
    expect(lowestPlos([plo('PLO1', null), plo('PLO2', 50)]).map((p) => p.code)).toEqual(['PLO2']);
  });
  it('keeps a measured zero', () => {
    expect(lowestPlos([plo('PLO1', 0), plo('PLO2', 50)])[0].code).toBe('PLO1');
  });
  it('breaks ties on code', () => {
    expect(lowestPlos([plo('PLO2', 50), plo('PLO1', 50)]).map((p) => p.code)).toEqual([
      'PLO1',
      'PLO2',
    ]);
  });
  it('does not change the array it is given', () => {
    const radar = [plo('PLO2', 50), plo('PLO1', 10)];
    lowestPlos(radar);
    expect(radar.map((p) => p.code)).toEqual(['PLO2', 'PLO1']);
  });
});

describe('summarizeLowestClos', () => {
  const clo = (code: string): LowestCloEntry => ({
    cloId: code,
    code,
    description: '',
    courseId: 'c',
    courseCode: 'C',
    courseName: 'C',
    achievementPercent: 40,
  });
  it('shows three and counts the rest of the tie', () => {
    const result = summarizeLowestClos(['D', 'A', 'C', 'B', 'E'].map(clo));
    expect(result.shown.map((c) => c.code)).toEqual(['A', 'B', 'C']);
    expect(result.hiddenCount).toBe(2);
  });
  it('has nothing hidden for a short list or none', () => {
    expect(summarizeLowestClos([clo('A')]).hiddenCount).toBe(0);
    expect(summarizeLowestClos([])).toEqual({ shown: [], hiddenCount: 0 });
  });
});

describe('hasLittleData', () => {
  it('is true below 5 people with a GPA, false from 5', () => {
    expect(hasLittleData(0)).toBe(true);
    expect(hasLittleData(4)).toBe(true);
    expect(hasLittleData(5)).toBe(false);
  });
  it('treats a bad number as little data', () => {
    expect(hasLittleData(Number.NaN)).toBe(true);
  });
});

describe('gpaBarPercent', () => {
  it('scales to 4.00 and clamps', () => {
    expect(gpaBarPercent(2)).toBe(50);
    expect(gpaBarPercent(5)).toBe(100);
    expect(gpaBarPercent(null)).toBe(0);
  });
});

describe('sortCohorts', () => {
  it('orders oldest intake first without mutating', () => {
    const cohort = (admissionYear: number) => ({ admissionYear }) as CohortPloAchievementReport;
    const input = [cohort(2567), cohort(2565)];
    expect(sortCohorts(input).map((c) => c.admissionYear)).toEqual([2565, 2567]);
    expect(input[0].admissionYear).toBe(2567);
  });
});

describe('hasAnyPloData', () => {
  it('needs at least one measured PLO', () => {
    expect(hasAnyPloData([plo('A', null)])).toBe(false);
    expect(hasAnyPloData([plo('A', null), plo('B', 0)])).toBe(true);
    expect(hasAnyPloData([])).toBe(false);
  });
});
