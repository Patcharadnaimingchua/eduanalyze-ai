import type {
  CourseCloAchievementReport,
  InstructorDashboardReport,
  StudentInstructorTimeline,
  StudentRosterEntry,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchInstructorDashboard() {
  const { data } = await apiClient.get<InstructorDashboardReport>('/dashboard/instructor');
  return data;
}

export async function fetchCourseRoster(courseId: string) {
  const { data } = await apiClient.get<StudentRosterEntry[]>(`/courses/${courseId}/students`);
  return data;
}

export async function fetchStudentTimeline(courseId: string, studentProfileId: string) {
  const { data } = await apiClient.get<StudentInstructorTimeline>(
    `/courses/${courseId}/students/${studentProfileId}/timeline`,
  );
  return data;
}

export async function fetchCourseCloAchievement(courseId: string) {
  const { data } = await apiClient.get<CourseCloAchievementReport>(
    `/clo-achievement/course/${courseId}`,
  );
  return data;
}
