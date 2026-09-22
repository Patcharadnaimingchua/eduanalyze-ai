import type { EvidenceSource } from '@eduanalyze-ai/shared-types';
import { Badge } from '@/components/ui/badge';

// States where a number came from, so a grade estimate can never be mistaken
// for real evidence. The backend puts `source` on every AchievementResult and
// resolves to NO_EVIDENCE rather than silently falling back to grades, so this
// badge just surfaces a decision already made server-side.
//
// Sibling of evidence-coverage-badge.tsx: the two answer different questions
// ("computed from what?" vs "how much of it is in?") and are meant to sit
// next to each other. Same 4-tone Badge, no new tone needed.
const SOURCE_PRESENTATION: Record<EvidenceSource, { tone: 'green' | 'amber' | 'gray'; label: string }> = {
  EVIDENCE_BASED: { tone: 'green', label: 'จากหลักฐานจริง' },
  LEGACY_GRADE_ESTIMATE: { tone: 'amber', label: 'ประมาณจากเกรด' },
  NO_EVIDENCE: { tone: 'gray', label: 'ยังไม่มีหลักฐาน' },
};

export function AchievementSourceBadge({ source }: Readonly<{ source: EvidenceSource }>) {
  const { tone, label } = SOURCE_PRESENTATION[source];
  return <Badge tone={tone}>{label}</Badge>;
}
