'use client';

import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CreditCheckReport } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeCourseDepths } from '@/lib/compute-course-depth';
import {
  PrerequisiteFlowNode,
  type CourseNodeData,
  type CourseNodeStatus,
} from './prerequisite-flow-node';

const NODE_TYPES = { course: PrerequisiteFlowNode };

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 100;

const LEGEND: { status: CourseNodeStatus; label: string; swatch: string }[] = [
  { status: 'passed', label: 'ผ่านแล้ว', swatch: 'bg-emerald-300' },
  { status: 'failed', label: 'ตกแล้ว ต้องลงใหม่', swatch: 'bg-amber-300' },
  { status: 'available', label: 'พร้อมลงทะเบียนได้', swatch: 'bg-sky-300' },
  { status: 'locked', label: 'ยังลงไม่ได้ (ติดวิชาก่อน)', swatch: 'bg-slate-300' },
];

export function PrerequisiteFlowChart({ report }: { report: CreditCheckReport }) {
  const { nodes, edges } = useMemo(() => {
    const passedIds = new Set(report.passedCourses.map((c) => c.courseId));
    const failedIds = new Set(report.failedCourses.map((c) => c.courseId));

    const allCourses = [
      ...report.passedCourses,
      ...report.failedCourses,
      ...report.notYetStudiedCourses,
    ];

    const depths = computeCourseDepths(
      allCourses.map((c) => ({
        courseId: c.courseId,
        prerequisiteCourseIds: c.prerequisiteCourseIds,
      })),
    );

    const countPerDepth = new Map<number, number>();
    const flowNodes: Node<CourseNodeData>[] = allCourses.map((course) => {
      const status: CourseNodeStatus = passedIds.has(course.courseId)
        ? 'passed'
        : failedIds.has(course.courseId)
          ? 'failed'
          : course.isPrerequisiteSatisfied
            ? 'available'
            : 'locked';

      const depth = depths.get(course.courseId) ?? 0;
      const row = countPerDepth.get(depth) ?? 0;
      countPerDepth.set(depth, row + 1);

      return {
        id: course.courseId,
        type: 'course',
        position: { x: depth * COLUMN_WIDTH, y: row * ROW_HEIGHT },
        data: {
          code: course.code,
          name: course.name,
          credits: course.credits,
          isRequired: course.isRequired,
          status,
        },
        draggable: false,
      };
    });

    const flowEdges: Edge[] = allCourses.flatMap((course) =>
      course.prerequisiteCourseIds
        // Guard against an edge pointing at a course outside this set
        // (e.g. an inactive course still referenced by an old
        // Prerequisite row) — skip rather than render a dangling edge.
        .filter((prereqId) => allCourses.some((c) => c.courseId === prereqId))
        .map((prereqId) => ({
          id: `${prereqId}->${course.courseId}`,
          source: prereqId,
          target: course.courseId,
          style: { stroke: '#94a3b8' },
        })),
    );

    return { nodes: flowNodes, edges: flowEdges };
  }, [report]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">แผนผังลำดับวิชาก่อน (Prerequisite Flow Chart)</CardTitle>
        <div className="flex flex-wrap gap-3 pt-2">
          {LEGEND.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${item.swatch}`} />
              {item.label}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: 520 }} className="overflow-hidden rounded-md border border-slate-100">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            nodesDraggable={false}
            nodesConnectable={false}
            fitView
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
