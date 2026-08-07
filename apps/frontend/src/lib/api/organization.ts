import type {
  CurriculumListItem,
  DepartmentListItem,
  FacultyListItem,
  ProgramListItem,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

// All 4 are public (no auth) — see the backend organization controllers'
// "Public — university org structure..." comment. No query-param
// filtering exists server-side (confirmed by reading the services), so
// each is fetched once in full and filtered client-side as the user
// picks a parent — see components/auth/dependent-org-select.tsx.

export async function fetchFaculties() {
  const { data } = await apiClient.get<FacultyListItem[]>('/faculties');
  return data;
}

export async function fetchDepartments() {
  const { data } = await apiClient.get<DepartmentListItem[]>('/departments');
  return data;
}

export async function fetchPrograms() {
  const { data } = await apiClient.get<ProgramListItem[]>('/programs');
  return data;
}

export async function fetchCurricula() {
  const { data } = await apiClient.get<CurriculumListItem[]>('/curricula');
  return data;
}
