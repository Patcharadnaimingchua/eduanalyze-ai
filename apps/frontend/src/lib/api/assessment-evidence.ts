import type {
  AchievementResult,
  AssessmentCloMapping,
  AssessmentDefinition,
  CreateAssessmentCloMappingRequest,
  CreateAssessmentDefinitionRequest,
  StudentAssessmentScore,
  UpsertStudentAssessmentScoreRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

// Wraps the 7 Phase 1 assessment-evidence endpoints — completely separate
// from lib/api/course-assessment.ts (1-5 self-assessment) and the
// grade-based endpoints in lib/api/instructor.ts. Plain thin functions,
// same pattern as course-assessment.ts: no useQuery/useMutation colocated
// here, callers wire these into React Query themselves.

export async function fetchAssessmentDefinitions(courseId: string) {
  const { data } = await apiClient.get<AssessmentDefinition[]>(
    `/assessment-definitions/course/${courseId}`,
  );
  return data;
}

export async function createAssessmentDefinition(dto: CreateAssessmentDefinitionRequest) {
  const { data } = await apiClient.post<AssessmentDefinition>('/assessment-definitions', dto);
  return data;
}

export async function fetchAssessmentCloMappings(assessmentDefinitionId: string, courseId: string) {
  const { data } = await apiClient.get<AssessmentCloMapping[]>(
    `/assessment-clo-mappings/assessment-definition/${assessmentDefinitionId}`,
    { params: { courseId } },
  );
  return data;
}

export async function createAssessmentCloMapping(dto: CreateAssessmentCloMappingRequest) {
  const { data } = await apiClient.post<AssessmentCloMapping>('/assessment-clo-mappings', dto);
  return data;
}

export async function fetchStudentAssessmentScores(assessmentCloMappingId: string, courseId: string) {
  const { data } = await apiClient.get<StudentAssessmentScore[]>(
    `/student-assessment-scores/clo-mapping/${assessmentCloMappingId}`,
    { params: { courseId } },
  );
  return data;
}

export async function upsertStudentAssessmentScore(dto: UpsertStudentAssessmentScoreRequest) {
  const { data } = await apiClient.put<StudentAssessmentScore>('/student-assessment-scores', dto);
  return data;
}

// Evidence-based Actual CLO Achievement for one attempt — used here only
// to show a coverage badge after scores are entered. Never confuse with
// the grade-based CLO achievement in lib/api/instructor.ts.
export async function fetchActualCloAchievement(
  courseId: string,
  studentCourseRecordId: string,
  cloId: string,
) {
  const { data } = await apiClient.get<AchievementResult>(
    `/actual-clo-achievement/course/${courseId}/student-course-record/${studentCourseRecordId}/clo/${cloId}`,
  );
  return data;
}
