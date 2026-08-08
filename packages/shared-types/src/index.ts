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
  // CLO-oriented threshold (Clo.achievementThreshold falls back to this),
  // reused client-side by the CLO/PLO Analysis page as a stand-in PLO
  // cutoff since no PLO-specific threshold exists in the backend — not a
  // PLO-specific number, see that page's code comment.
  defaultAchievementThreshold: number;
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

// ---- Detailed CLO/PLO Analysis (GET /plo-achievement/student/:studentProfileId) ----
// Same RadarPoint shape the Dashboard's `radar` field already uses (this
// endpoint and Dashboard's report share the identical interface
// server-side) — no status/description/threshold fields, joined
// client-side from GET /plos and the student's own curriculum.

export interface StudentPloAchievementResponse {
  studentProfileId: string;
  curriculumId: string;
  radar: RadarPoint[];
  strengths: RadarPoint[];
  areasForImprovement: RadarPoint[];
}

export interface PloListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  curriculumId: string;
}

// ---- Course Assessment (POST/PATCH/DELETE /course-assessments, GET .../course/:courseId/me) ----
// GET /clos — unfiltered, client-side filter by courseId, same pattern as
// GET /courses. CourseAssessmentResponse.cloScores is a plain Prisma
// `include`, not a join — raw rows with only cloId, no embedded CLO
// code/description (confirmed against course-assessment.service.ts).

export interface CloListItem {
  id: string;
  code: string;
  description: string;
  courseId: string;
}

export interface CloScoreInput {
  cloId: string;
  score: number; // 1-5
}

export interface CourseAssessmentCloScoreRow {
  id: string;
  score: number;
  courseAssessmentId: string;
  cloId: string;
}

export interface CourseAssessmentResponse {
  id: string;
  courseId: string;
  studentProfileId: string;
  comment: string | null;
  cloScores: CourseAssessmentCloScoreRow[];
}

export interface CreateCourseAssessmentRequest {
  courseId: string;
  cloScores: CloScoreInput[];
  comment?: string;
}

export interface UpdateCourseAssessmentRequest {
  cloScores: CloScoreInput[];
  comment?: string;
}

// ---- Smart Credit Checker (GET /credit-checker/:studentProfileId) ----
// Mirrors apps/backend's CreditCheckReport exactly, including its real
// quirks: creditsAccumulated is an exact alias of creditsPassed (not a
// separate calc), and missingRequiredCourses intentionally overlaps with
// failedCourses/notYetStudiedCourses (a required course not yet passed
// appears in both its status bucket and this list).

export interface CourseSummary {
  courseId: string;
  code: string;
  name: string;
  credits: number;
  grade?: Grade;
}

export interface CategoryProgress {
  categoryId: string;
  name: string;
  minCredits: number;
  minCourses: number | null;
  creditsEarned: number;
  coursesPassedCount: number;
  isComplete: boolean;
}

export interface CreditCheckReport {
  studentProfileId: string;
  curriculumId: string;
  totalCreditsRequired: number;
  creditsStudied: number;
  creditsPassed: number;
  creditsAccumulated: number;
  creditsRemaining: number;
  passedCourses: CourseSummary[];
  failedCourses: CourseSummary[];
  notYetStudiedCourses: CourseSummary[];
  // isPrerequisiteSatisfied is a bare boolean server-side — no field
  // anywhere identifies WHICH prerequisite is missing (see TODO.md).
  missingRequiredCourses: (CourseSummary & { isPrerequisiteSatisfied: boolean })[];
  categoryProgress: CategoryProgress[];
  graduationReadiness: GraduationReadiness;
}

// ---- My Academic Record (GET/POST/PATCH/DELETE /student-course-records) ----
// Mirrors apps/backend's StudentCourseRecord Prisma model — raw rows, no
// denormalized course/semester name (frontend joins client-side against
// GET /courses and GET /semesters, same as CreditCheckerService does
// server-side for its own reports).

export interface StudentCourseRecord {
  id: string;
  grade: Grade;
  credits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfileId: string;
  courseId: string;
  semesterId: string;
}

export interface CreateStudentCourseRecordRequest {
  // Required by the DTO but ignored server-side for STUDENT (resolved from
  // the JWT instead) — sent anyway to satisfy validation, per
  // student-course-record.service.ts's resolveOwnStudentProfileIdOrValidate.
  studentProfileId: string;
  courseId: string;
  semesterId: string;
  grade: Grade;
}

export interface UpdateStudentCourseRecordRequest {
  grade: Grade;
}

export interface GpaSummary {
  gpa: number | null;
  creditsCounted: number;
  courseCount: number;
}

export interface CourseListItem {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  credits: number;
  isRequired: boolean;
  isActive: boolean;
  curriculumId: string;
  categoryId: string;
}

export type SemesterTerm = 'FIRST' | 'SECOND' | 'SUMMER';

export interface AcademicYear {
  id: string;
  year: number;
  isActive: boolean;
}

export interface Semester {
  id: string;
  term: SemesterTerm;
  isActive: boolean;
  academicYearId: string;
}
