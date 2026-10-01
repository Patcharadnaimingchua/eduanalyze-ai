import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Line-art family for EmptyState. Shared grammar: 96x96 grid, 2px round
// strokes, one soft brand-light fill per drawing, dashed strokes for "what is
// missing". Only currentColor and theme tokens are used, so dark mode follows
// without dark: variants. No text inside the SVGs (nothing to localise); they
// are decorative and the description beside them carries the meaning.
export type EmptyStateIllustration =
  | 'no-data'
  | 'no-students'
  | 'no-outcomes'
  | 'no-results'
  | 'all-done';

const DASH = '3 4';

function IllustrationFrame({
  size,
  className,
  children,
}: Readonly<{ size: number; className?: string; children: ReactNode }>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0 text-brand', className)}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

type IllustrationProps = Readonly<{ size: number; className?: string }>;

function NoData(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <g opacity={0.45} strokeDasharray={DASH}>
        <rect x={34} y={12} width={28} height={26} rx={3} />
        <path d="M40 22h16M40 29h10" />
      </g>
      <g opacity={0.85}>
        <path d="M14 58 22 42h52l8 16v14a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4Z" className="fill-brand-light" />
        <path d="M14 58h24a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4h24" />
      </g>
      <g opacity={0.5}>
        <path d="M78 18v8M74 22h8" />
        <circle cx={18} cy={26} r={1.5} />
      </g>
    </IllustrationFrame>
  );
}

function NoStudents(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <g opacity={0.45} strokeDasharray={DASH}>
        <circle cx={64} cy={34} r={9} />
        <path d="M58 56c12-2 22 4 22 20" />
      </g>
      <g opacity={0.85}>
        <circle cx={40} cy={38} r={11} className="fill-brand-light" />
        <path d="M16 78c0-14 10-22 24-22s24 8 24 22Z" className="fill-brand-light" />
      </g>
      <g opacity={0.5}>
        <path d="M80 16v8M76 20h8" />
        <circle cx={14} cy={30} r={1.5} />
      </g>
    </IllustrationFrame>
  );
}

function NoOutcomes(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <g opacity={0.85}>
        <path d="M48 16 74 31v30L48 76 22 61V31Z" className="fill-brand-light" />
      </g>
      <g opacity={0.35}>
        <path d="M48 28 63 37v18L48 64 33 55V37Z" />
        <path d="M48 46V16M48 46 74 31M48 46l26 15M48 46v30M48 46 22 61M48 46 22 31" />
      </g>
      <g opacity={0.6} strokeDasharray={DASH}>
        <path d="M48 32 64 42 58 58 40 56 34 42Z" />
      </g>
      <circle cx={48} cy={46} r={2.5} fill="currentColor" opacity={0.85} />
      <g opacity={0.5}>
        <path d="M82 14v8M78 18h8" />
        <circle cx={14} cy={72} r={1.5} />
      </g>
    </IllustrationFrame>
  );
}

function NoResults(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <g opacity={0.85}>
        <circle cx={42} cy={42} r={22} className="fill-brand-light" />
        <path d="m58 58 18 18" />
      </g>
      <g opacity={0.45} strokeDasharray={DASH}>
        <circle cx={42} cy={42} r={11} />
      </g>
      <g opacity={0.5}>
        <path d="M76 16v8M72 20h8" />
        <circle cx={16} cy={76} r={1.5} />
      </g>
    </IllustrationFrame>
  );
}

function AllDone(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <g opacity={0.85}>
        <rect x={20} y={18} width={48} height={62} rx={6} className="fill-brand-light" />
        <rect x={34} y={12} width={20} height={9} rx={3} className="fill-brand-light" />
        <path d="m28 36 3 3 5-6M28 50l3 3 5-6M28 64l3 3 5-6" />
      </g>
      <g opacity={0.4}>
        <path d="M43 36h17M43 50h17M43 64h17" />
      </g>
      <g opacity={0.85}>
        <circle cx={70} cy={68} r={13} className="fill-brand-light" />
        <path d="m63 68 5 5 9-10" />
      </g>
      <g opacity={0.5}>
        <path d="M82 20v8M78 24h8" />
        <circle cx={12} cy={40} r={1.5} />
      </g>
    </IllustrationFrame>
  );
}

export const EMPTY_STATE_ILLUSTRATIONS: Record<EmptyStateIllustration, ComponentType<IllustrationProps>> = {
  'no-data': NoData,
  'no-students': NoStudents,
  'no-outcomes': NoOutcomes,
  'no-results': NoResults,
  'all-done': AllDone,
};
