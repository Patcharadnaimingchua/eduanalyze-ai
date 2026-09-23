import { cn } from '@/lib/utils';
import { BADGE_TONE_CLASSES, type SemanticTone } from '@/lib/tone';

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: SemanticTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        BADGE_TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
