import { computeGpaChange, formatGpaChange } from './gpa-change';

const trend = (...gpas: number[]) => gpas.map((gpa) => ({ gpa }));

describe('computeGpaChange', () => {
  it('returns null with no data', () => {
    expect(computeGpaChange(undefined)).toBeNull();
    expect(computeGpaChange(null)).toBeNull();
    expect(computeGpaChange([])).toBeNull();
  });

  it('returns null with a single term', () => {
    expect(computeGpaChange(trend(3.2))).toBeNull();
  });

  it('is up when the latest term is higher', () => {
    const change = computeGpaChange(trend(3.0, 3.18));
    expect(change?.direction).toBe('up');
    expect(change?.delta).toBeCloseTo(0.18, 10);
  });

  it('is down when the latest term is lower', () => {
    const change = computeGpaChange(trend(3.5, 3.4));
    expect(change?.direction).toBe('down');
    expect(change?.delta).toBeCloseTo(-0.1, 10);
  });

  it('is flat when identical', () => {
    expect(computeGpaChange(trend(3.0, 3.0))).toEqual({ direction: 'flat', delta: 0 });
  });

  it('is flat below 0.005 and moves just above it', () => {
    expect(computeGpaChange(trend(3.0, 3.004))?.direction).toBe('flat');
    expect(computeGpaChange(trend(3.004, 3.0))?.direction).toBe('flat');
    expect(computeGpaChange(trend(3.0, 3.006))?.direction).toBe('up');
    expect(computeGpaChange(trend(3.006, 3.0))?.direction).toBe('down');
  });

  it('only compares the two most recent terms', () => {
    expect(computeGpaChange(trend(1.0, 4.0, 2.5, 2.7))?.direction).toBe('up');
    expect(computeGpaChange(trend(1.0, 2.0, 3.9, 3.7))?.direction).toBe('down');
  });

  it('keeps a 0.00 term (a real GPA) rather than treating it as missing', () => {
    expect(computeGpaChange(trend(0, 2.5))?.direction).toBe('up');
    expect(computeGpaChange(trend(2.5, 0))?.direction).toBe('down');
  });

  it('returns null instead of NaN for non-finite values', () => {
    expect(computeGpaChange(trend(3.0, Number.NaN))).toBeNull();
    expect(computeGpaChange(trend(Number.POSITIVE_INFINITY, 3.0))).toBeNull();
  });
});

describe('formatGpaChange', () => {
  it('formats up with and without sign', () => {
    const change = computeGpaChange(trend(3.34, 3.52))!;
    expect(formatGpaChange(change, { signed: true })).toBe('▲ +0.18 จากเทอมก่อน');
    expect(formatGpaChange(change, { signed: false })).toBe('▲ 0.18 จากเทอมก่อน');
  });

  it('formats down with a real minus sign', () => {
    const change = computeGpaChange(trend(3.5, 3.4))!;
    expect(formatGpaChange(change, { signed: true })).toBe('▼ −0.10 จากเทอมก่อน');
    expect(formatGpaChange(change, { signed: false })).toBe('▼ 0.10 จากเทอมก่อน');
  });

  it('formats flat identically either way', () => {
    const change = computeGpaChange(trend(3.0, 3.0))!;
    expect(formatGpaChange(change, { signed: true })).toBe('– เท่าเดิม');
    expect(formatGpaChange(change, { signed: false })).toBe('– เท่าเดิม');
  });

  it('never shows a 0.00 magnitude for a non-flat change', () => {
    const change = computeGpaChange(trend(3.0, 3.006))!;
    expect(formatGpaChange(change, { signed: true })).toBe('▲ +0.01 จากเทอมก่อน');
  });
});
