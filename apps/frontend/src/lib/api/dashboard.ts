import type {
  StudentDashboardResponse,
  StudentProfileMeResponse,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchOwnStudentProfile() {
  const { data } = await apiClient.get<StudentProfileMeResponse>('/student-profiles/me');
  return data;
}

export async function fetchStudentDashboard(studentProfileId: string) {
  const { data } = await apiClient.get<StudentDashboardResponse>(
    `/dashboard/student/${studentProfileId}`,
  );
  return data;
}
