import { Badge } from '@/components/ui/badge';

// Deliberately NOT typed against the backend's CoverageInfo (which also
// carries Decimal-string weight fields for the achievement calculation) —
// this badge is reused for two different counts: an AchievementResult's
// per-CLO evidence coverage, and the score-entry grid's simpler "how many
// roster students have a graded score" count. Both reduce to validCount/
// totalCount, so that's all this component needs.
//
// green = every item counted (validCount === totalCount, and at least one
// item exists), amber = some but not all counted, gray = nothing counted
// yet. Existing tone vocabulary is enough — no need to extend SemanticTone.
export function EvidenceCoverageBadge({
  coverage,
}: {
  coverage: { validCount: number; totalCount: number };
}) {
  if (coverage.totalCount === 0 || coverage.validCount === 0) {
    return <Badge tone="neutral">ยังไม่มีคะแนน 0/{coverage.totalCount}</Badge>;
  }
  if (coverage.validCount === coverage.totalCount) {
    return (
      <Badge tone="success">
        ครบ {coverage.validCount}/{coverage.totalCount}
      </Badge>
    );
  }
  return (
    <Badge tone="warning">
      บางส่วน {coverage.validCount}/{coverage.totalCount}
    </Badge>
  );
}
