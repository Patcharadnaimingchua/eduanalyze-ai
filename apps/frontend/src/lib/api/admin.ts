import type {
  AcademicYear,
  CreateAcademicYearRequest,
  CreateSemesterRequest,
  Semester,
  UpdateAcademicYearRequest,
  UpdateSemesterRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function createAcademicYear(dto: CreateAcademicYearRequest) {
  const { data } = await apiClient.post<AcademicYear>('/academic-years', dto);
  return data;
}

export async function updateAcademicYear(id: string, dto: UpdateAcademicYearRequest) {
  const { data } = await apiClient.patch<AcademicYear>(`/academic-years/${id}`, dto);
  return data;
}

export async function deleteAcademicYear(id: string) {
  await apiClient.delete(`/academic-years/${id}`);
}

export async function createSemester(dto: CreateSemesterRequest) {
  const { data } = await apiClient.post<Semester>('/semesters', dto);
  return data;
}

export async function updateSemester(id: string, dto: UpdateSemesterRequest) {
  const { data } = await apiClient.patch<Semester>(`/semesters/${id}`, dto);
  return data;
}

export async function deleteSemester(id: string) {
  await apiClient.delete(`/semesters/${id}`);
}
