// Vertical room a course node needs in the prerequisite graph. The node wraps its
// name instead of cutting it, so a long name takes more lines and the nodes below
// it in the same column have to start lower.
export const NODE_BASE_HEIGHT = 84;
export const NODE_LINE_HEIGHT = 16;
export const NODE_GAP = 16;
const NAME_CHARS_PER_LINE = 20;

export function estimateNodeHeight(name: string): number {
  const lines = Math.max(1, Math.ceil(name.length / NAME_CHARS_PER_LINE));
  return NODE_BASE_HEIGHT + (lines - 1) * NODE_LINE_HEIGHT;
}

// Top of the next node in a column, given where the previous one started.
export function nextNodeTop(top: number, name: string): number {
  return top + estimateNodeHeight(name) + NODE_GAP;
}
