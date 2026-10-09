export interface OrgCounts {
  departments: number;
  programs: number;
  curricula: number;
}

interface Dept {
  id: string;
  facultyId: string;
}
interface Prog {
  id: string;
  departmentId: string;
}
interface Curr {
  programId: string;
}

// How many active units sit below each node, so a row can say what is inside
// it before it is opened and can tell why it cannot be deactivated yet.
export function buildOrgCounts(
  faculties: readonly { id: string }[],
  departments: readonly Dept[],
  programs: readonly Prog[],
  curricula: readonly Curr[],
) {
  const faculty = new Map<string, OrgCounts>(
    faculties.map((f) => [f.id, { departments: 0, programs: 0, curricula: 0 }]),
  );
  const department = new Map<string, OrgCounts>(
    departments.map((d) => [d.id, { departments: 0, programs: 0, curricula: 0 }]),
  );
  const program = new Map<string, OrgCounts>(
    programs.map((p) => [p.id, { departments: 0, programs: 0, curricula: 0 }]),
  );
  const departmentById = new Map(departments.map((d) => [d.id, d]));
  const programById = new Map(programs.map((p) => [p.id, p]));

  for (const d of departments) {
    const f = faculty.get(d.facultyId);
    if (f) f.departments += 1;
  }
  for (const p of programs) {
    department.get(p.departmentId)!.programs += 1;
    const d = departmentById.get(p.departmentId);
    const f = d && faculty.get(d.facultyId);
    if (f) f.programs += 1;
  }
  for (const c of curricula) {
    const p = programById.get(c.programId);
    if (!p) continue;
    program.get(p.id)!.curricula += 1;
    department.get(p.departmentId)!.curricula += 1;
    const d = departmentById.get(p.departmentId);
    const f = d && faculty.get(d.facultyId);
    if (f) f.curricula += 1;
  }
  return { faculty, department, program };
}

// "8 ภาควิชา · 24 สาขา · 18 หลักสูตร" — only the levels below the node.
export function describeCounts(
  counts: OrgCounts,
  levels: readonly ('departments' | 'programs' | 'curricula')[],
): string {
  const labels = { departments: 'ภาควิชา', programs: 'สาขา', curricula: 'หลักสูตร' };
  return levels.map((level) => `${counts[level]} ${labels[level]}`).join(' · ');
}
