import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// One numbered step of the score-entry flow. A step that cannot be used yet
// still shows its heading and says what to do first, so the whole path
// (1 → 2 → 3) is visible at a glance. Done is shown with a check and the
// word "เลือกแล้ว", never by colour alone.
export function EvidenceStep({
  number,
  title,
  hint,
  done = false,
  waiting = false,
  waitingText,
  children,
}: Readonly<{
  number: number;
  title: string;
  hint?: string;
  done?: boolean;
  waiting?: boolean;
  waitingText?: string;
  children: ReactNode;
}>) {
  const headingId = `evidence-step-${number}`;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            done ? 'bg-brand text-white' : 'bg-brand-light text-brand',
            waiting && 'opacity-60',
          )}
        >
          {done ? <Check size={14} /> : number}
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className={cn('text-lg font-semibold text-primary', waiting && 'text-muted-foreground')}>
            ขั้นที่ {number} · {title}
            {done && <span className="ml-2 text-sm font-normal text-brand">เลือกแล้ว</span>}
          </h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {waiting ? <p className="pl-10 text-sm text-muted-foreground">{waitingText}</p> : children}
    </section>
  );
}
