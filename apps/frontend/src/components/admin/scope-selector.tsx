'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import {
  fetchDepartments,
  fetchFaculties,
  fetchPrograms,
} from '@/lib/api/organization';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LEVEL_LABELS: Record<string, string> = {
  FACULTY: 'คณะ',
  DEPARTMENT: 'ภาควิชา',
  PROGRAM: 'หลักสูตร',
};

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

  const targetOptions =
    level === 'FACULTY'
      ? (facultiesQuery.data ?? [])
      : level === 'DEPARTMENT'
        ? (departmentsQuery.data ?? [])
        : level === 'PROGRAM'
          ? (programsQuery.data ?? [])
          : [];

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
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
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
          <FormItem className="flex-1">
            <FormLabel>หน่วยงาน</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!level}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหน่วยงาน" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {targetOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
