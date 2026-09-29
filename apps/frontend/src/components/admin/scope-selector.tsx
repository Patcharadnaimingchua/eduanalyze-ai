'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import {
  fetchDepartments,
  fetchFaculties,
  fetchPrograms,
} from '@/lib/api/organization';
import { SCOPE_LEVEL_LABELS } from '@/lib/scope-labels';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Picks exactly one of Faculty/Department/Program (not always drilling
// down to Curriculum like DependentOrgSelect does for student
// registration) — a UserScope covers everything below the chosen level,
// so the admin only ever needs to land on one node in the hierarchy.
// Field names are parameterized so this same component works both inside
// CreateUserForm (scopeLevel/scopeTargetId, since those fields are
// optional there) and inside a standalone grant-scope form (level/
// targetId, matching scope.schema.ts).
export function ScopeSelector({
  levelFieldName = 'level',
  targetFieldName = 'targetId',
}: {
  levelFieldName?: string;
  targetFieldName?: string;
}) {
  const { control, watch, resetField } = useFormContext();
  const level = watch(levelFieldName);

  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });

  // Names alone are ambiguous (two faculties can each have a "วิศวกรรมคอมพิวเตอร์"
  // program), so each option carries its parent chain and code, and all of it
  // is searchable. Inactive nodes are left out: the backend rejects them.
  const targetOptions = useMemo<ComboboxOption[]>(() => {
    const faculties = facultiesQuery.data ?? [];
    const departments = departmentsQuery.data ?? [];
    const programs = programsQuery.data ?? [];
    const facultyName = new Map(faculties.map((f) => [f.id, f.name]));
    const departmentById = new Map(departments.map((d) => [d.id, d]));

    function option(id: string, name: string, code: string, context: string[]): ComboboxOption {
      const contextText = context.filter(Boolean).join(' › ');
      return {
        value: id,
        label: contextText ? `${name} (${code}) · ${contextText}` : `${name} (${code})`,
        searchText: `${name} ${code} ${contextText}`,
      };
    }

    if (level === 'FACULTY') {
      return faculties.filter((f) => f.isActive).map((f) => option(f.id, f.name, f.code, []));
    }
    if (level === 'DEPARTMENT') {
      return departments
        .filter((d) => d.isActive)
        .map((d) => option(d.id, d.name, d.code, [facultyName.get(d.facultyId) ?? '']));
    }
    if (level === 'PROGRAM') {
      return programs
        .filter((p) => p.isActive)
        .map((p) => {
          const department = departmentById.get(p.departmentId);
          return option(p.id, p.name, p.code, [
            department ? (facultyName.get(department.facultyId) ?? '') : '',
            department?.name ?? '',
          ]);
        });
    }
    return [];
  }, [level, facultiesQuery.data, departmentsQuery.data, programsQuery.data]);

  return (
    <div className="flex gap-3">
      <FormField
        control={control}
        name={levelFieldName}
        render={({ field }) => (
          <FormItem className="w-40">
            <FormLabel>ระดับขอบเขต</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                resetField(targetFieldName, { defaultValue: '' });
              }}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกระดับ" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(SCOPE_LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={targetFieldName}
        render={({ field }) => (
          <FormItem className="min-w-[26rem] flex-1">
            <FormLabel>หน่วยงาน</FormLabel>
            <FormControl>
              <Combobox
                options={targetOptions}
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={!level}
                placeholder="เลือกหน่วยงาน"
                searchPlaceholder="ค้นหาชื่อ รหัส หรือคณะ..."
                emptyText="ไม่พบหน่วยงานที่ตรงกับคำค้นหา"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
