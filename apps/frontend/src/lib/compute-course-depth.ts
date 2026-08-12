interface DepthInput {
  courseId: string;
  prerequisiteCourseIds: string[];
}

// Topological depth per course: 0 if it has no prerequisites, otherwise
// 1 + the deepest of its prerequisites' own depths. Used to lay the
// Prerequisite Flow Chart out in columns (depth = column index) without
// pulling in a general graph-layout library (dagre/elkjs) — the graph is
// a DAG by domain rules (a course can't require itself, directly or
// transitively), so longest-path-from-roots is a well-defined, readable
// layout on its own.
//
// visited/inStack guards against a cycle reaching this function anyway
// (e.g. bad data entered by STAFF/ADMIN before a future integrity check
// catches it) — courses on a cycle fall back to depth 0 rather than
// recursing forever or crashing the page.
export function computeCourseDepths(courses: DepthInput[]): Map<string, number> {
  const byId = new Map(courses.map((c) => [c.courseId, c]));
  const depths = new Map<string, number>();
  const inStack = new Set<string>();

  function depthOf(courseId: string): number {
    const cached = depths.get(courseId);
    if (cached !== undefined) return cached;

    if (inStack.has(courseId)) {
      // Cycle detected — treat as a root rather than recursing forever.
      return 0;
    }

    const course = byId.get(courseId);
    if (!course || course.prerequisiteCourseIds.length === 0) {
      depths.set(courseId, 0);
      return 0;
    }

    inStack.add(courseId);
    const maxPrereqDepth = Math.max(
      ...course.prerequisiteCourseIds.map((id) => depthOf(id)),
    );
    inStack.delete(courseId);

    const depth = maxPrereqDepth + 1;
    depths.set(courseId, depth);
    return depth;
  }

  for (const course of courses) {
    depthOf(course.courseId);
  }

  return depths;
}
