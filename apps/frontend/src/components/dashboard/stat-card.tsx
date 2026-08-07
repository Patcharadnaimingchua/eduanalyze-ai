import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  suffix?: string;
  badge?: { text: string; tone?: 'positive' | 'neutral' };
}

// Deliberately no percentile/trend badges — the Figma mockup had "Top
// 15%" and "+3% this term" on these cards, but no endpoint anywhere
// computes a peer percentile or a term-over-term delta. `badge` here is
// only ever fed a value derived from real fields (e.g. graduationReadiness
// .creditsMet → "On Track"), never a placeholder number.
export function StatCard({ icon: Icon, label, value, suffix, badge }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-start justify-between">
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
        <p className="text-3xl font-semibold text-primary">
          {value}
          {suffix && <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
