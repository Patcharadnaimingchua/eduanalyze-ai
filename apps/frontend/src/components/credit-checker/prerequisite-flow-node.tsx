import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export type CourseNodeStatus = 'passed' | 'failed' | 'available' | 'locked';

export interface CourseNodeData extends Record<string, unknown> {
  code: string;
  name: string;
  credits: number;
  isRequired: boolean;
  status: CourseNodeStatus;
}

const STATUS_STYLES: Record<CourseNodeStatus, string> = {
  passed: 'border-emerald-300 bg-emerald-50',
  failed: 'border-amber-300 bg-amber-50',
  available: 'border-sky-300 bg-sky-50',
  locked: 'border-slate-200 bg-slate-50',
};

// Custom React Flow node — small card matching the rest of the app's
// hand-rolled "badge" styling (no shadcn Badge component exists in this
// project, see TODO.md/plan notes; StatCard/CategoryProgressList use the
// same <span> + cn() pattern).
export function PrerequisiteFlowNode({ data }: NodeProps & { data: CourseNodeData }) {
  return (
    <div
      className={cn(
        'w-52 rounded-lg border-2 px-3 py-2 text-left shadow-sm',
        STATUS_STYLES[data.status],
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-primary">{data.code}</span>
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            data.isRequired ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600',
          )}
        >
          {data.isRequired ? 'บังคับ' : 'เลือก'}
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-slate-600" title={data.name}>
        {data.name}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">{data.credits} หน่วยกิต</p>
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </div>
  );
}
