import type {
  CurriculumListItem,
  PloListItem,
  StudentPloAchievementResponse,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchStudentPloAchievement(studentProfileId: string) {
  const { data } = await apiClient.get<StudentPloAchievementResponse>(
    `/plo-achievement/student/${studentProfileId}`,
  );
  return data;
}

// Unfiltered system-wide list, same pattern as /courses — caller filters
// client-side to the student's own curriculumId.
export async function fetchPlos() {
  const { data } = await apiClient.get<PloListItem[]>('/plos');
  return data;
}

export async function fetchCurriculum(curriculumId: string) {
  const { data } = await apiClient.get<CurriculumListItem>(`/curricula/${curriculumId}`);
  return data;
}
