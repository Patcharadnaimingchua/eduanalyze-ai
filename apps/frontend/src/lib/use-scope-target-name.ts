'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserScope } from '@eduanalyze-ai/shared-types';
import { fetchDepartments, fetchFaculties, fetchPrograms } from '@/lib/api/organization';

// Same query keys as ScopeSelector, so all three lists come from the shared
// cache. Names are looked up client-side because UserScope rows carry only ids.
export function useScopeTargetName(): (scope: UserScope) => string {
  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });

  return (scope) => {
    const targetId = scope.facultyId ?? scope.departmentId ?? scope.programId;
    const list =
      scope.level === 'FACULTY'
        ? facultiesQuery.data
        : scope.level === 'DEPARTMENT'
          ? departmentsQuery.data
          : programsQuery.data;
    return list?.find((item) => item.id === targetId)?.name ?? '—';
  };
}
