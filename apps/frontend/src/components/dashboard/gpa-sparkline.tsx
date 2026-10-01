import type { GpaTrendPoint } from '@eduanalyze-ai/shared-types';
import { formatSemesterLabel } from '@/lib/grade-label';

const WIDTH = 120;
const HEIGHT = 32;
const PAD = 4;
// Keeps a flat or near-flat history from being stretched into a dramatic zigzag.
const MIN_SPAN = 0.5;

function toCoordinates(points: readonly GpaTrendPoint[]): { x: number; y: number }[] {
  const values = points.map((p) => p.gpa);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, MIN_SPAN);
  const low = (min + max) / 2 - span / 2;
  const stepX = (WIDTH - PAD * 2) / (points.length - 1);
  return points.map((p, i) => ({
    x: PAD + i * stepX,
    y: PAD + (1 - (p.gpa - low) / span) * (HEIGHT - PAD * 2),
  }));
}

// Non-interactive on purpose: the GPA StatCard it sits in is a link.
// Semesters are spaced evenly (not by calendar gap) and a trend needs at
// least two of them, so fewer points render nothing.
export function GpaSparkline({ points }: Readonly<{ points: readonly GpaTrendPoint[] }>) {
  if (points.length < 2) return null;

  const coordinates = toCoordinates(points);
  const first = points[0];
  const last = points[points.length - 1];
  const lastCoordinate = coordinates[coordinates.length - 1];
  const label =
    `แนวโน้มเกรดเฉลี่ยรายภาคเรียน ${points.length} ภาคเรียน: ` +
    `${formatSemesterLabel(first.semesterTerm, first.academicYear)} ${first.gpa.toFixed(2)} ` +
    `ถึง ${formatSemesterLabel(last.semesterTerm, last.academicYear)} ${last.gpa.toFixed(2)}`;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">เกรดเฉลี่ยรายภาคเรียน</p>
      <svg
        role="img"
        aria-label={label}
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        fill="none"
        className="shrink-0"
      >
        <polyline
          points={coordinates.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
          pathLength={1}
          strokeDasharray={1}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spark-line stroke-primary motion-reduce:animate-none"
        />
        <circle
          cx={lastCoordinate.x}
          cy={lastCoordinate.y}
          r={3}
          className="animate-radar-dot fill-primary motion-reduce:animate-none"
        />
      </svg>
    </div>
  );
}
