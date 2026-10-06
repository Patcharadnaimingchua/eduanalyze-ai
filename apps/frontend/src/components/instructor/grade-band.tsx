import { ALL_GRADES, type GradeCounts } from '@/lib/instructor-overview';
import { GRADE_LABELS } from '@/lib/grade-label';
import { BAR_TONE_CLASSES, type SemanticTone } from '@/lib/tone';
import { cn } from '@/lib/utils';
import { PageSection } from '@/components/layout/page-section';
import type { Grade } from '@eduanalyze-ai/shared-types';

interface Band {
  key: string;
  label: string;
  grades: Grade[];
  tone: SemanticTone;
}

// One bar for the whole grade picture. Four groups, each named in the legend
// with its number, so the bar is never read by colour alone; F and W get their
// own numbers because they are the two the instructor asks about first.
const BANDS: Band[] = [
  { key: 'high', label: 'B ขึ้นไป', grades: ['A', 'B_PLUS', 'B'], tone: 'success' },
  { key: 'mid', label: 'C+ ถึง C', grades: ['C_PLUS', 'C'], tone: 'warning' },
  { key: 'low', label: 'D+ ถึง F', grades: ['D_PLUS', 'D', 'F'], tone: 'danger' },
  { key: 'none', label: 'ไม่คิดเกรด (W, I, S, U)', grades: ['W', 'I', 'S', 'U'], tone: 'neutral' },
];

export function GradeBand({
  counts,
  description = 'ผลล่าสุดของนักศึกษาแต่ละคน รวมทุกวิชา',
}: Readonly<{ counts: GradeCounts; description?: string }>) {
  const total = ALL_GRADES.reduce((sum, g) => sum + counts[g], 0);
  const bands = BANDS.map((b) => ({ ...b, n: b.grades.reduce((s, g) => s + counts[g], 0) }));
  return (
    <PageSection title="การกระจายเกรด" description={description}>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีเกรด</p>
      ) : (
        <div className="space-y-3">
          <div
            role="img"
            aria-label={bands.map((b) => `${b.label} ${b.n} คน`).join(' · ')}
            className="flex h-8 overflow-hidden rounded-lg bg-slate-100"
          >
            {bands
              .filter((b) => b.n > 0)
              .map((b) => (
                <span
                  key={b.key}
                  className={cn('flex items-center justify-center text-sm font-semibold text-white', BAR_TONE_CLASSES[b.tone], b.tone === 'warning' && 'text-amber-950')}
                  style={{ width: `${(b.n / total) * 100}%` }}
                >
                  {b.n}
                </span>
              ))}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {bands.map((b) => (
              <li key={b.key} className="flex items-center gap-2">
                <span aria-hidden="true" className={cn('h-3 w-3 rounded-sm', BAR_TONE_CLASSES[b.tone])} />
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-semibold tabular-nums text-primary">{b.n}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            ได้ {GRADE_LABELS.F} <span className="font-semibold text-primary">{counts.F}</span> คน · ถอน ({GRADE_LABELS.W}){' '}
            <span className="font-semibold text-primary">{counts.W}</span> คน
          </p>
        </div>
      )}
    </PageSection>
  );
}
