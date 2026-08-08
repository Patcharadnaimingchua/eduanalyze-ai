import type { LearningPathReport } from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchLearningPath(studentProfileId: string) {
  const { data } = await apiClient.get<LearningPathReport>(
    `/learning-path/${studentProfileId}`,
  );
  return data;
}
