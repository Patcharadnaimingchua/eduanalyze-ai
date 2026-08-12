import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useCountUp } from '@/lib/use-count-up';
import { gpaColorClassName } from '@/lib/gpa-color';
import { cn } from '@/lib/utils';

// Separate component (not inlined in RecordTimeline's .map()) so
// useCountUp — a hook — gets exactly one call per mounted instance,
// satisfying the Rules of Hooks. The number of semester groups isn't
// fixed (changes when a record is deleted), so calling the hook directly
// inside the parent's loop would violate the rule.
export function SemesterGroupHeader({
  label,
  gpa,
  previousGpa,
  creditsCounted,
  isExpanded,
  onToggle,
}: {
  label: string;
  gpa: number | null;
  // Nearest earlier semester with a real (non-null) GPA — null if this is
  // the first semester with data, or if there's nothing earlier to
  // compare against. See record-timeline.tsx for how this is resolved.
  previousGpa: number | null;
  creditsCounted: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // This component mounts once (for every semester, expanded or not) and
  // stays mounted while the user toggles isExpanded — so useCountUp's own
  // mount-time animation plays once, immediately, before the user ever
  // looks at the collapsed sections. openCount increments only on a
  // false→true transition (not on collapse, and not on the initial
  // mount) and is fed to useCountUp as a replayKey so opening a section
  // replays the count-up without remounting the button (which would
  // otherwise break the chevron's rotate transition, since a fresh DOM
  // node has no "previous" rotation to transition from).
  const [openCount, setOpenCount] = useState(0);
  const wasExpandedRef = useRef(isExpanded);
  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      setOpenCount((c) => c + 1);
    }
    wasExpandedRef.current = isExpanded;
  }, [isExpanded]);

  const animatedGpa = useCountUp(gpa ?? 0, { duration: 700, decimals: 2, replayKey: openCount });
  const animatedCredits = useCountUp(creditsCounted, { duration: 700, decimals: 0, replayKey: openCount });

  // Trend arrow — a different color axis from gpaColorClassName's
  // absolute-level bands: this one is about direction of change versus
  // the last term with real data, not the number's own magnitude.
  const showTrend = gpa != null && previousGpa != null;
  const trend = showTrend
    ? gpa! > previousGpa!
      ? 'up'
      : gpa! < previousGpa!
        ? 'down'
        : 'same'
    : null;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColorClassName =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
    >
      <span className="flex items-center gap-2">
        <ChevronDown
          size={16}
          className={cn('text-muted-foreground transition-transform', isExpanded ? 'rotate-0' : '-rotate-90')}
        />
        <h3 className="font-semibold text-primary">{label}</h3>
      </span>
      {gpa != null && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          เกรดเฉลี่ยเทอมนี้{' '}
          <span className={cn('font-semibold', gpaColorClassName(gpa))}>{animatedGpa.toFixed(2)}</span>
          {showTrend && <TrendIcon size={14} className={trendColorClassName} />}
          <span>({Math.round(animatedCredits)} หน่วยกิต)</span>
        </span>
      )}
    </button>
  );
}
