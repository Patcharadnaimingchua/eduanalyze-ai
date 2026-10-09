import { NODE_BASE_HEIGHT, NODE_GAP, estimateNodeHeight, nextNodeTop } from './prerequisite-layout';

describe('prerequisite graph layout', () => {
  it('a short name keeps the single-line node height', () => {
    expect(estimateNodeHeight('แคลคูลัส 1')).toBe(NODE_BASE_HEIGHT);
  });

  it('each extra line of a long name adds a line of height', () => {
    expect(estimateNodeHeight('ก'.repeat(21))).toBe(NODE_BASE_HEIGHT + 16);
    expect(estimateNodeHeight('ก'.repeat(61))).toBe(NODE_BASE_HEIGHT + 3 * 16);
  });

  it('the next node starts below the previous one plus the gap', () => {
    expect(nextNodeTop(0, 'สั้น')).toBe(NODE_BASE_HEIGHT + NODE_GAP);
    expect(nextNodeTop(100, 'ก'.repeat(25))).toBe(100 + NODE_BASE_HEIGHT + 16 + NODE_GAP);
  });
});
