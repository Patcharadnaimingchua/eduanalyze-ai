import { isAxiosError } from 'axios';
import type {
  CloListItem,
  CourseAssessmentResponse,
  CreateCourseAssessmentRequest,
  UpdateCourseAssessmentRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

// Unfiltered system-wide list, same pattern as /courses — caller filters
// client-side by courseId.
export async function fetchClos() {
  const { data } = await apiClient.get<CloListItem[]>('/clos');
  return data;
}

// 404 means "not submitted yet" — a normal, expected state for this page
// (create-or-edit flow), not a failure — returns null instead of throwing
// so the caller can distinguish it from a real load error.
export async function fetchOwnAssessment(courseId: string) {
  try {
    const { data } = await apiClient.get<CourseAssessmentResponse>(
      `/course-assessments/course/${courseId}/me`,
    );
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createAssessment(dto: CreateCourseAssessmentRequest) {
  const { data } = await apiClient.post<CourseAssessmentResponse>('/course-assessments', dto);
  return data;
}

export async function updateAssessment(id: string, dto: UpdateCourseAssessmentRequest) {
  const { data } = await apiClient.patch<CourseAssessmentResponse>(
    `/course-assessments/${id}`,
    dto,
  );
  return data;
}
