import { ChevronDown } from 'lucide-react';
import { useCountUp } from '@/lib/use-count-up';
import { cn } from '@/lib/utils';

// Separate component (not inlined in RecordTimeline's .map()) so
// useCountUp — a hook — gets exactly one call per mounted instance,
// satisfying the Rules of Hooks. The number of semester groups isn't
// fixed (changes when a record is deleted), so calling the hook directly
// inside the parent's loop would violate the rule.
export function SemesterGroupHeader({
  label,
  gpa,
  creditsCounted,
  isExpanded,
  onToggle,
}: {
  label: string;
  gpa: number | null;
  creditsCounted: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const animatedGpa = useCountUp(gpa ?? 0, { duration: 700, decimals: 2 });
  const animatedCredits = useCountUp(creditsCounted, { duration: 700, decimals: 0 });

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
        <span className="text-xs text-muted-foreground">
          เกรดเฉลี่ยเทอมนี้ {animatedGpa.toFixed(2)} ({Math.round(animatedCredits)} หน่วยกิต)
        </span>
      )}
    </button>
  );
}
