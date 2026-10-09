import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value?: React.ReactNode;
  suffix?: string;
  badge?: { text: string; tone?: 'positive' | 'neutral' };
  footer?: React.ReactNode;
  // Replaces the big number: shown to the right of the icon + label (e.g. a
  // progress ring that carries its own centre value). When the card is too
  // narrow for both side by side it drops below the label instead of
  // squeezing the label into the ring.
  visual?: React.ReactNode;
  href?: string;
  // Shorter card for dense pages: less padding, smaller figure.
  compact?: boolean;
}

// Deliberately no percentile/trend badges — the Figma mockup had "Top
// 15%" and "+3% this term" on these cards, but no endpoint anywhere
// computes a peer percentile or a term-over-term delta. `badge` here is
// only ever fed a value derived from real fields (e.g. graduationReadiness
// .creditsMet → "On Track"), never a placeholder number.
export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  badge,
  footer,
  visual,
  href,
  compact = false,
}: Readonly<StatCardProps>) {
  const heading = (
    <>
      <div className={cn(compact ? 'mb-2' : 'mb-3', 'flex items-start justify-between')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
          <Icon size={18} className="text-brand" />
        </div>
        {badge && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              badge.tone === 'positive'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-600',
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
    </>
  );

  const card = (
    <Card className="h-full transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md">
      <CardContent className={compact ? 'p-4' : 'pt-6'}>
        {visual ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[4rem] flex-1">{heading}</div>
            {visual}
          </div>
        ) : (
          <>
            {heading}
            <p className={cn(compact ? 'text-2xl' : 'text-3xl', 'font-semibold text-primary')}>
              {value}
              {suffix && (
                <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>
              )}
            </p>
          </>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
