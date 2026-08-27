'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchCurricula,
  fetchDepartments,
  fetchFaculties,
  fetchPrograms,
} from '@/lib/api/organization';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Cascading Faculty→Department→Program→Curriculum, adapted from
// components/auth/dependent-org-select.tsx for a non-form context (this
// drives a URL query param, not a react-hook-form field) — org GET
// endpoints are unfiltered/public (same as the register flow), so this
// shows every curriculum in the system; ScopeGuard on the mutating
// endpoints downstream is what actually blocks STAFF from acting outside
// their scope, not this picker.
export function CurriculumPicker({
  curriculumId,
  onSelect,
}: {
  curriculumId: string | null;
  onSelect: (curriculumId: string) => void;
}) {
  const [facultyId, setFacultyId] = useState<string | undefined>();
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [programId, setProgramId] = useState<string | undefined>();

  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula });

  // Reverse-derive the faculty/department/program chain when curriculumId
  // arrives from the URL (initial load, back/forward navigation) so the
  // selects show the right ancestry instead of resetting to empty.
  useEffect(() => {
    if (!curriculumId || !curriculaQuery.data || !programsQuery.data || !departmentsQuery.data) {
      return;
    }
    const curriculum = curriculaQuery.data.find((c) => c.id === curriculumId);
    if (!curriculum) return;
    const program = programsQuery.data.find((p) => p.id === curriculum.programId);
    if (!program) return;
    const department = departmentsQuery.data.find((d) => d.id === program.departmentId);
    if (!department) return;

    setFacultyId((current) => current ?? department.facultyId);
    setDepartmentId((current) => current ?? department.id);
    setProgramId((current) => current ?? program.id);
    // Only fill in gaps, never overwrite a selection the user already made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculumId, curriculaQuery.data, programsQuery.data, departmentsQuery.data]);

  const departments = (departmentsQuery.data ?? []).filter((d) => d.facultyId === facultyId);
  const programs = (programsQuery.data ?? []).filter((p) => p.departmentId === departmentId);
  const curricula = (curriculaQuery.data ?? []).filter((c) => c.programId === programId);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <Label>คณะ</Label>
        <Select
          value={facultyId}
          onValueChange={(value) => {
            setFacultyId(value);
            setDepartmentId(undefined);
            setProgramId(undefined);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกคณะ" />
          </SelectTrigger>
          <SelectContent>
            {(facultiesQuery.data ?? []).map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>ภาควิชา</Label>
        <Select
          value={departmentId}
          onValueChange={(value) => {
            setDepartmentId(value);
            setProgramId(undefined);
          }}
          disabled={!facultyId}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกภาควิชา" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>หลักสูตร</Label>
        <Select value={programId} onValueChange={setProgramId} disabled={!departmentId}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกหลักสูตร" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>ฉบับหลักสูตร</Label>
        <Select value={curriculumId ?? undefined} onValueChange={onSelect} disabled={!programId}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกฉบับหลักสูตร" />
          </SelectTrigger>
          <SelectContent>
            {curricula.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {`${c.version} (พ.ศ. ${c.effectiveYear})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
