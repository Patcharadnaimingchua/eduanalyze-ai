import type { Grade } from '@eduanalyze-ai/shared-types';
import { isLowGrade } from './low-grade';

describe('isLowGrade', () => {
  it('is D+, D, F and U only: C and above, W, I and S are not', () => {
    const low: Grade[] = ['D_PLUS', 'D', 'F', 'U'];
    const notLow: Grade[] = ['A', 'B_PLUS', 'B', 'C_PLUS', 'C', 'W', 'I', 'S'];
    expect(low.every(isLowGrade)).toBe(true);
    expect(notLow.some(isLowGrade)).toBe(false);
  });
});
