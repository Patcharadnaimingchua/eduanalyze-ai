import type {
  LearningPathPlan,
  LearningPathReport,
  SaveLearningPathPlanRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchLearningPath(studentProfileId: string) {
  const { data } = await apiClient.get<LearningPathReport>(
    `/learning-path/${studentProfileId}`,
  );
  return data;
}

export async function fetchMyLearningPathPlan(): Promise<LearningPathPlan | null> {
  const { data } = await apiClient.get<LearningPathPlan | null>('/learning-path-plan/me');
  return data;
}

export async function saveMyLearningPathPlan(
  payload: SaveLearningPathPlanRequest,
): Promise<LearningPathPlan> {
  const { data } = await apiClient.put<LearningPathPlan>('/learning-path-plan/me', payload);
  return data;
}

export async function deleteMyLearningPathPlan(): Promise<void> {
  await apiClient.delete('/learning-path-plan/me');
}
