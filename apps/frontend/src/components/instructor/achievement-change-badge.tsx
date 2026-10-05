import { formatAchievementChange, type AchievementChange } from '@/lib/instructor-summary';
import type { SemanticTone } from '@/lib/tone';
import { Badge } from '@/components/ui/badge';

const TONE: Record<AchievementChange['direction'], SemanticTone> = {
  up: 'success',
  // A dip between terms is worth noticing, not an alarm.
  down: 'warning',
  flat: 'neutral',
};

// Arrow + sign + words, so the direction never relies on colour alone.
export function AchievementChangeBadge({ change }: Readonly<{ change: AchievementChange }>) {
  return <Badge tone={TONE[change.direction]}>{formatAchievementChange(change, { signed: true })}</Badge>;
}
