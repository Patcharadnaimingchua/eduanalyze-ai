// Phase 0: foundation only — shared types are added incrementally starting Phase 1.
// Frontend F1 (Auth pages) is the first consumer — Auth request/response
// shapes and the org-structure list-item shapes used by the dependent
// Faculty→Department→Program→Curriculum select on the Register page.

// ---- Auth requests ----

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  studentCode: string;
  programId: string;
  curriculumId: string;
  admissionYear: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface CompleteGoogleRegistrationRequest {
  pendingToken: string;
  studentCode: string;
  programId: string;
  curriculumId: string;
  admissionYear: number;
}

// ---- Auth responses ----

// register/login: OTP sent, no token yet
export interface OtpPendingResponse {
  userId: string;
  email: string;
}

// verify-otp / google/complete-registration / refresh: refresh token is
// an httpOnly cookie the browser handles automatically — never present in
// a JSON body, only the access token is.
export interface AccessTokenResponse {
  accessToken: string;
}

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export interface CurrentUserResponse {
  userId: string;
  email: string;
  fullName: string;
  roles: Role[];
}

// ---- Organization structure (public, unauthenticated GETs) ----

export interface FacultyListItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface DepartmentListItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  facultyId: string;
}

export interface ProgramListItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  departmentId: string;
}

export interface CurriculumListItem {
  id: string;
  version: string;
  effectiveYear: number;
  totalCredits: number;
  isActive: boolean;
  isOpenForRegistration: boolean;
  programId: string;
}

// ---- GET /student-profiles/me — the logged-in STUDENT's own profile.
// Dashboard needs studentProfileId, which /auth/me does not expose
// (CurrentUserResponse is identity-only, not academic-record data) — this
// is the one extra call the dashboard page makes before fetching it.
export interface StudentProfileMeResponse {
  id: string;
  userId: string;
  studentCode: string;
  programId: string;
  curriculumId: string;
  admissionYear: number;
  isActive: boolean;
}

// ---- Student Dashboard (GET /dashboard/student/:studentProfileId) ----
// Mirrors apps/backend/src/modules/dashboard/dashboard-report.interface.ts

export type Grade =
  | 'A'
  | 'B_PLUS'
  | 'B'
  | 'C_PLUS'
  | 'C'
  | 'D_PLUS'
  | 'D'
  | 'F'
  | 'W'
  | 'I'
  | 'S'
  | 'U';

export interface GraduationReadiness {
  isReady: boolean;
  creditsMet: boolean;
  allCategoriesMet: boolean;
  missingRequiredCount: number;
}

export interface RadarPoint {
  ploId: string;
  code: string;
  name: string;
  // null = no relevant CLO data yet for this student — distinct from 0.
  value: number | null;
}

export interface RecentCourse {
  courseId: string;
  code: string;
  name: string;
  credits: number;
  grade: Grade;
  academicYear: number;
  semesterTerm: string;
}

export interface MissingRequiredCourse {
  courseId: string;
  code: string;
  name: string;
  credits: number;
  isPrerequisiteSatisfied: boolean;
}

export interface IncompleteElectiveCategory {
  categoryId: string;
  name: string;
  creditsEarned: number;
  minCredits: number;
  creditsShort: number;
}

export interface StudentDashboardResponse {
  studentProfileId: string;
  gpa: number | null;
  creditsEarned: number;
  creditsRemaining: number;
  totalCreditsRequired: number;
  curriculumProgressPercent: number;
  graduationReadiness: GraduationReadiness;
  radar: RadarPoint[];
  strengths: RadarPoint[];
  areasForImprovement: RadarPoint[];
  recentCourses: RecentCourse[];
  missingRequiredCourses: MissingRequiredCourse[];
  incompleteElectiveCategories: IncompleteElectiveCategory[];
  // Module 7 exists as a standalone endpoint but the Dashboard doesn't
  // call it (kept fast/free) — always null here, by design, not a bug.
  aiSummary: null;
}
