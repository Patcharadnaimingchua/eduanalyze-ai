import type { SemesterGpa } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendPoint {
  semesterId: string;
  label: string;
  gpa: number | null;
}

const WIDTH = 640;
const HEIGHT = 160;
const PADDING_X = 32;
const PADDING_Y = 20;

// Hand-rolled SVG line chart — no chart library in this project (same
// convention as plo-radar-chart.tsx/use-count-up.ts). GPA is on a fixed
// 0-4 scale so the y-axis never needs to rescale to data, which keeps
// the plotting math simple (no min/max detection needed).
export function GpaTrendChart({
  semesters,
  gpaBySemester,
}: {
  semesters: { id: string; label: string }[];
  gpaBySemester: SemesterGpa[];
}) {
  const gpaBySemesterId = new Map(gpaBySemester.map((s) => [s.semesterId, s.gpa]));

  // semesters is already newest-first (matches the Timeline) — the chart
  // reads left-to-right chronologically, so reverse for plotting only.
  const points: TrendPoint[] = [...semesters]
    .reverse()
    .map((s) => ({ semesterId: s.id, label: s.label, gpa: gpaBySemesterId.get(s.id) ?? null }));

  const plottable = points.filter((p) => p.gpa !== null);
  if (plottable.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">แนวโน้มเกรดเฉลี่ยรายเทอม</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลเกรดเฉลี่ยรายเทอม</p>
        </CardContent>
      </Card>
    );
  }

  const stepX = points.length > 1 ? (WIDTH - PADDING_X * 2) / (points.length - 1) : 0;
  const yFor = (gpa: number) => HEIGHT - PADDING_Y - (gpa / 4) * (HEIGHT - PADDING_Y * 2);
  const xFor = (index: number) => PADDING_X + index * stepX;

  // Only connect consecutive semesters that BOTH have a real GPA — a
  // semester with only W/I/S/U (gpa: null) breaks the line into a new
  // polyline rather than being interpolated across (would fabricate a
  // value that never existed).
  const polylines: string[] = [];
  let run: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.gpa === null) {
      if (run.length > 1) polylines.push(run.join(' L '));
      run = [];
      continue;
    }
    run.push(`${xFor(i)},${yFor(p.gpa)}`);
  }
  if (run.length > 1) polylines.push(run.join(' L '));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">แนวโน้มเกรดเฉลี่ยรายเทอม</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="กราฟแนวโน้มเกรดเฉลี่ยรายเทอม">
          {[0, 1, 2, 3, 4].map((tick) => (
            <line
              key={tick}
              x1={PADDING_X}
              x2={WIDTH - PADDING_X}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          ))}

          {polylines.map((d, i) => (
            <path key={i} d={`M ${d}`} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
          ))}

          {points.map((p, i) =>
            p.gpa === null ? null : (
              <circle key={p.semesterId} cx={xFor(i)} cy={yFor(p.gpa)} r={3.5} fill="hsl(var(--primary))" />
            ),
          )}

          {points.map((p, i) => (
            <text
              key={p.semesterId}
              x={xFor(i)}
              y={HEIGHT - 2}
              textAnchor="middle"
              className="fill-slate-400"
              fontSize={9}
            >
              {p.label}
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}
