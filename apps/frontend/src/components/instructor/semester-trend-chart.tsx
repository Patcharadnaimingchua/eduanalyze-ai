'use client';

import type { SemesterAchievement } from '@eduanalyze-ai/shared-types';
import { formatSemesterLabel } from '@/lib/grade-label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 48;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 48;
const PLOT_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// No chart library in this project — hand-built SVG, same no-dependency
// approach as plo-radar-chart.tsx. Y axis is a fixed 0-100% (achievement
// percent is always a percentage), unlike a data-relative min/max.
export function SemesterTrendChart({ trend }: { trend: SemesterAchievement[] }) {
  if (trend.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        ต้องมีข้อมูลอย่างน้อย 2 ภาคเรียนจึงจะแสดงแนวโน้มได้
      </p>
    );
  }

  const plotWidth = WIDTH - PADDING_X * 2;
  const stepX = trend.length > 1 ? plotWidth / (trend.length - 1) : 0;
  const points = trend.map((point, i) => ({
    ...point,
    x: PADDING_X + stepX * i,
    y: PADDING_TOP + PLOT_HEIGHT * (1 - point.achievementPercent / 100),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img">
        {gridLines.map((percent) => {
          const y = PADDING_TOP + PLOT_HEIGHT * (1 - percent / 100);
          return (
            <g key={percent}>
              <line
                x1={PADDING_X}
                y1={y}
                x2={WIDTH - PADDING_X}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text x={PADDING_X - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {percent}%
              </text>
            </g>
          );
        })}

        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth={2} />

        {points.map((p) => (
          <g key={`${p.academicYear}-${p.semesterTerm}`}>
            <circle cx={p.x} cy={p.y} r={4} fill="#2563eb" className="pointer-events-none" />
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              fill="#1e293b"
              className="pointer-events-none"
            >
              {Math.round(p.achievementPercent)}%
            </text>
            <text
              x={p.x}
              y={HEIGHT - 28}
              textAnchor="middle"
              fontSize={11}
              fill="#64748b"
              className="pointer-events-none"
            >
              {formatSemesterLabel(p.semesterTerm, p.academicYear)}
            </text>
            <text
              x={p.x}
              y={HEIGHT - 14}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
              className="pointer-events-none"
            >
              {p.studentCount} คน
            </text>
            {/* Transparent oversized circle as the hover hit-target, painted
                last so it sits on top of the labels above for hit-testing —
                the visible r=4 dot above stays the same size as before. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
              </TooltipTrigger>
              <TooltipContent>
                {formatSemesterLabel(p.semesterTerm, p.academicYear)}:{' '}
                {p.achievementPercent.toFixed(1)}% ({p.studentCount} คน)
              </TooltipContent>
            </Tooltip>
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted-foreground">
        รวมทุกกลุ่มเรียนของวิชานี้ในแต่ละภาคเรียน ไม่แยกตามผู้สอน
      </p>
    </div>
  );
}
