import type {
  CourseCategory,
  CourseInstructor,
  CreateCourseCategoryRequest,
  CreateCourseInstructorRequest,
  CreateCourseRequest,
  CreateCurriculumRequirementRequest,
  CreatePrerequisiteRequest,
  CurriculumRequirement,
  InstructorListItem,
  Prerequisite,
  StudentCourseRecord,
  StudentProfileSummary,
  UpdateCourseCategoryRequest,
  UpdateCourseRequest,
  UpdateCurriculumRequirementRequest,
  UpdatePrerequisiteRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchStudentProfiles() {
  const { data } = await apiClient.get<StudentProfileSummary[]>('/student-profiles');
  return data;
}

export async function fetchStudentProfile(id: string) {
  const { data } = await apiClient.get<StudentProfileSummary>(`/student-profiles/${id}`);
  return data;
}

// Same endpoint STUDENT self-service uses (fetchMyCourseRecords in
// lib/api/academic-record.ts) — for STAFF/ADMIN it returns every record
// within the requester's scope, not just one student's, hence a
// differently-named wrapper here rather than reusing that import directly.
export async function fetchCourseRecordsInScope() {
  const { data } = await apiClient.get<StudentCourseRecord[]>('/student-course-records');
  return data;
}

export async function fetchInstructorsInScope() {
  const { data } = await apiClient.get<InstructorListItem[]>('/users/instructors');
  return data;
}

export async function fetchCourseCategories() {
  const { data } = await apiClient.get<CourseCategory[]>('/course-categories');
  return data;
}

export async function createCourseCategory(dto: CreateCourseCategoryRequest) {
  const { data } = await apiClient.post<CourseCategory>('/course-categories', dto);
  return data;
}

export async function updateCourseCategory(id: string, dto: UpdateCourseCategoryRequest) {
  const { data } = await apiClient.patch<CourseCategory>(`/course-categories/${id}`, dto);
  return data;
}

export async function deleteCourseCategory(id: string) {
  await apiClient.delete(`/course-categories/${id}`);
}

export async function fetchCurriculumRequirements() {
  const { data } = await apiClient.get<CurriculumRequirement[]>('/curriculum-requirements');
  return data;
}

export async function createCurriculumRequirement(dto: CreateCurriculumRequirementRequest) {
  const { data } = await apiClient.post<CurriculumRequirement>('/curriculum-requirements', dto);
  return data;
}

export async function updateCurriculumRequirement(
  id: string,
  dto: UpdateCurriculumRequirementRequest,
) {
  const { data } = await apiClient.patch<CurriculumRequirement>(
    `/curriculum-requirements/${id}`,
    dto,
  );
  return data;
}

export async function deleteCurriculumRequirement(id: string) {
  await apiClient.delete(`/curriculum-requirements/${id}`);
}

export async function createCourse(dto: CreateCourseRequest) {
  const { data } = await apiClient.post('/courses', dto);
  return data;
}

export async function updateCourse(id: string, dto: UpdateCourseRequest) {
  const { data } = await apiClient.patch(`/courses/${id}`, dto);
  return data;
}

export async function deleteCourse(id: string) {
  await apiClient.delete(`/courses/${id}`);
}

export async function fetchPrerequisites() {
  const { data } = await apiClient.get<Prerequisite[]>('/prerequisites');
  return data;
}

export async function createPrerequisite(dto: CreatePrerequisiteRequest) {
  const { data } = await apiClient.post<Prerequisite>('/prerequisites', dto);
  return data;
}

export async function updatePrerequisite(id: string, dto: UpdatePrerequisiteRequest) {
  const { data } = await apiClient.patch<Prerequisite>(`/prerequisites/${id}`, dto);
  return data;
}

export async function deletePrerequisite(id: string) {
  await apiClient.delete(`/prerequisites/${id}`);
}

export async function fetchCourseInstructors() {
  const { data } = await apiClient.get<CourseInstructor[]>('/course-instructors');
  return data;
}

export async function createCourseInstructor(dto: CreateCourseInstructorRequest) {
  const { data } = await apiClient.post<CourseInstructor>('/course-instructors', dto);
  return data;
}

export async function deleteCourseInstructor(id: string) {
  await apiClient.delete(`/course-instructors/${id}`);
}
