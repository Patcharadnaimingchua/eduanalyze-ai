import { formatGpaChange, type GpaChange } from '@/lib/gpa-change';
import type { SemanticTone } from '@/lib/tone';
import { Badge } from '@/components/ui/badge';

const TONE: Record<GpaChange['direction'], SemanticTone> = {
  up: 'success',
  // A dip between terms is worth noticing, not an alarm.
  down: 'warning',
  flat: 'neutral',
};

// Arrow + sign + words, so the direction never relies on colour alone.
export function GpaChangeBadge({ change }: Readonly<{ change: GpaChange }>) {
  return <Badge tone={TONE[change.direction]}>{formatGpaChange(change, { signed: true })}</Badge>;
}
