'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDepartment,
  createFaculty,
  createProgram,
  deleteDepartment,
  deleteFaculty,
  deleteProgram,
  fetchCurricula,
  fetchDepartments,
  fetchFaculties,
  fetchPrograms,
  updateDepartment,
  updateFaculty,
  updateProgram,
} from '@/lib/api/organization';
import { AddOrgEntity, OrgNodeRow } from './org-node-row';
import { CurriculumPanel } from './curriculum-panel';

const ORG_QUERY_KEYS = [['faculties'], ['departments'], ['programs'], ['curricula']];

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
}

const byCode = <T extends { code: string }>(a: T, b: T) => a.code.localeCompare(b.code);

export function OrgTree() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula });
  const queries = [facultiesQuery, departmentsQuery, programsQuery, curriculaQuery];

  // Await so callers only close their form once the tree shows the new data.
  async function refetchAll() {
    await Promise.all(
      ORG_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (queries.some((q) => q.isLoading)) {
    return <p className="text-sm text-muted-foreground">กำลังโหลดโครงสร้างองค์กร...</p>;
  }
  if (queries.some((q) => q.isError)) {
    return <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>;
  }

  const faculties = [...(facultiesQuery.data ?? [])].sort(byCode);
  const departmentsByFaculty = groupBy(departmentsQuery.data ?? [], (d) => d.facultyId);
  const programsByDepartment = groupBy(programsQuery.data ?? [], (p) => p.departmentId);
  const curriculaByProgram = groupBy(curriculaQuery.data ?? [], (c) => c.programId);

  return (
    <div className="space-y-3">
      <AddOrgEntity
        label="เพิ่มคณะ"
        onCreate={async (values) => {
          await createFaculty(values);
          await refetchAll();
        }}
      />

      {faculties.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีคณะในระบบ</p>}

      {faculties.map((faculty) => {
        const departments = [...(departmentsByFaculty.get(faculty.id) ?? [])].sort(byCode);
        return (
          <OrgNodeRow
            key={faculty.id}
            item={faculty}
            levelLabel="คณะ"
            childCount={departments.length}
            childLabel="ภาควิชา"
            expanded={expanded.has(faculty.id)}
            onToggle={() => toggle(faculty.id)}
            onUpdate={async (values) => {
              await updateFaculty(faculty.id, values);
              await refetchAll();
            }}
            onDeactivate={async () => {
              await deleteFaculty(faculty.id);
              await refetchAll();
            }}
          >
            {departments.map((department) => {
              const programs = [...(programsByDepartment.get(department.id) ?? [])].sort(byCode);
              return (
                <OrgNodeRow
                  key={department.id}
                  item={department}
                  levelLabel="ภาควิชา"
                  childCount={programs.length}
                  childLabel="สาขา"
                  expanded={expanded.has(department.id)}
                  onToggle={() => toggle(department.id)}
                  onUpdate={async (values) => {
                    await updateDepartment(department.id, values);
                    await refetchAll();
                  }}
                  onDeactivate={async () => {
                    await deleteDepartment(department.id);
                    await refetchAll();
                  }}
                >
                  {programs.map((program) => {
                    const curricula = curriculaByProgram.get(program.id) ?? [];
                    return (
                      <OrgNodeRow
                        key={program.id}
                        item={program}
                        levelLabel="สาขา"
                        childCount={curricula.length}
                        childLabel="หลักสูตร"
                        expanded={expanded.has(program.id)}
                        onToggle={() => toggle(program.id)}
                        onUpdate={async (values) => {
                          await updateProgram(program.id, values);
                          await refetchAll();
                        }}
                        onDeactivate={async () => {
                          await deleteProgram(program.id);
                          await refetchAll();
                        }}
                      >
                        <CurriculumPanel
                          programId={program.id}
                          curricula={curricula}
                          onChanged={refetchAll}
                        />
                      </OrgNodeRow>
                    );
                  })}
                  <AddOrgEntity
                    label="เพิ่มสาขา"
                    onCreate={async (values) => {
                      await createProgram({ ...values, departmentId: department.id });
                      await refetchAll();
                    }}
                  />
                </OrgNodeRow>
              );
            })}
            <AddOrgEntity
              label="เพิ่มภาควิชา"
              onCreate={async (values) => {
                await createDepartment({ ...values, facultyId: faculty.id });
                await refetchAll();
              }}
            />
          </OrgNodeRow>
        );
      })}
    </div>
  );
}
