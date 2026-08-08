import type {
  AcademicYear,
  CourseListItem,
  CreateStudentCourseRecordRequest,
  GpaSummary,
  Semester,
  StudentCourseRecord,
  UpdateStudentCourseRecordRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

// Self-scoped server-side for STUDENT — no id param needed/accepted.
export async function fetchMyCourseRecords() {
  const { data } = await apiClient.get<StudentCourseRecord[]>('/student-course-records');
  return data;
}

export async function fetchMyGpa(studentProfileId: string) {
  const { data } = await apiClient.get<GpaSummary>(
    `/student-course-records/gpa/${studentProfileId}`,
  );
  return data;
}

// Unfiltered system-wide list — caller filters to the student's own
// curriculumId client-side (no curriculum query param exists server-side).
export async function fetchCourses() {
  const { data } = await apiClient.get<CourseListItem[]>('/courses');
  return data;
}

export async function fetchAcademicYears() {
  const { data } = await apiClient.get<AcademicYear[]>('/academic-years');
  return data;
}

export async function fetchSemesters() {
  const { data } = await apiClient.get<Semester[]>('/semesters');
  return data;
}

export async function createCourseRecord(dto: CreateStudentCourseRecordRequest) {
  const { data } = await apiClient.post<StudentCourseRecord>('/student-course-records', dto);
  return data;
}

export async function updateCourseRecordGrade(id: string, dto: UpdateStudentCourseRecordRequest) {
  const { data } = await apiClient.patch<StudentCourseRecord>(
    `/student-course-records/${id}`,
    dto,
  );
  return data;
}

export async function deleteCourseRecord(id: string) {
  await apiClient.delete(`/student-course-records/${id}`);
}
