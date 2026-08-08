import type { RadarPoint } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SIZE = 320;
const CENTER = SIZE / 2;
const MAX_RADIUS = 110;
const LABEL_RADIUS = 140;
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];

function pointOnAxis(index: number, total: number, radius: number) {
  const angle = -90 + (360 / total) * index;
  const rad = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

// No chart library in this project — hand-built SVG, same no-dependency
// approach as overall-achievement-card.tsx's ring. Null-valued PLOs (no
// relevant CLO data yet) are plotted at the center so the polygon shape
// stays geometrically valid, but are NEVER labeled as "0%" — the label
// shows "ไม่มีข้อมูล" instead, so a missing axis never reads as a
// confirmed zero score (PROJECT_CONTEXT.md §25's "never fabricate/imply
// evidence that isn't there").
export function PloRadarChart({ radar }: { radar: RadarPoint[] }) {
  const total = radar.length;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Radar ความสำเร็จตาม PLO</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">ยังไม่มีข้อมูล PLO สำหรับหลักสูตรนี้</p>
        </CardContent>
      </Card>
    );
  }

  const dataPoints = radar.map((plo, i) =>
    pointOnAxis(i, total, MAX_RADIUS * (plo.value !== null ? Math.max(0, Math.min(100, plo.value)) / 100 : 0)),
  );
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Radar ความสำเร็จตาม PLO</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Background rings */}
          {RING_FRACTIONS.map((fraction) => {
            const ringPoints = Array.from({ length: total }, (_, i) =>
              pointOnAxis(i, total, MAX_RADIUS * fraction),
            )
              .map((p) => `${p.x},${p.y}`)
              .join(' ');
            return (
              <polygon
                key={fraction}
                points={ringPoints}
                className="fill-none stroke-slate-100"
                strokeWidth={1}
              />
            );
          })}

          {/* Axis lines */}
          {radar.map((_, i) => {
            const outer = pointOnAxis(i, total, MAX_RADIUS);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={outer.x}
                y2={outer.y}
                className="stroke-slate-100"
                strokeWidth={1}
              />
            );
          })}

          {/* Data polygon — fillOpacity as a direct SVG attribute rather than
              a Tailwind opacity modifier (fill-brand/20), since `brand` is
              defined as a full `hsl(var(--brand))` string in tailwind.config
              rather than the <alpha-value> placeholder pattern Tailwind's
              color-opacity utilities require to work. */}
          <polygon
            points={polygonPoints}
            className="fill-brand stroke-brand"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-brand" />
          ))}

          {/* Labels */}
          {radar.map((plo, i) => {
            const labelPos = pointOnAxis(i, total, LABEL_RADIUS);
            return (
              <text
                key={plo.ploId}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-primary text-[11px] font-medium"
              >
                <tspan x={labelPos.x} dy="-0.3em">
                  {plo.code}
                </tspan>
                <tspan x={labelPos.x} dy="1.2em">
                  {plo.value === null ? 'ไม่มีข้อมูล' : `${Math.round(plo.value)}%`}
                </tspan>
              </text>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
