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

// register/login/google/complete-registration/refresh: refresh token is
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
  mustChangePassword: boolean;
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
  // Semester Planning cap (§28) — used by the Learning Path page to show
  // "X / maxCreditsPerSemester หน่วยกิต" against nextSemesterPlan's total.
  // Institution-specific default (22), not a universal constant.
  maxCreditsPerSemester: number;
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
  // Present on the real response (pass-through from LearningPathReport —
  // Dashboard's incompleteElectiveCategories is the same backend data,
  // not a separately-computed subset) but unused until the Learning Path
  // page needed it — CourseSummary is declared further down this file,
  // referencing it here is fine since TS type declarations aren't
  // order-sensitive.
  availableElectivesInCategory: CourseSummary[];
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

// Per-CLO detail nested under a PLO — lets the CLO/PLO Analysis page show
// which courses/CLOs make up a PLO's number, not just the averaged value.
export interface StudentPloCloBreakdownEntry {
  cloId: string;
  code: string;
  description: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  score: number | null;
  isAchieved: boolean;
}

export interface StudentPloRadarPoint extends RadarPoint {
  cloBreakdown: StudentPloCloBreakdownEntry[];
}

export interface StudentPloAchievementResponse {
  studentProfileId: string;
  curriculumId: string;
  radar: StudentPloRadarPoint[];
  strengths: RadarPoint[];
  areasForImprovement: RadarPoint[];
}

// ---- AI Skill Analysis (GET /ai-analysis/student/:studentProfileId) ----
// Qualitative-only by construction (PROJECT_CONTEXT.md §25/26) — the
// Anthropic tool schema backing this has zero numeric fields, so there is
// no per-axis score here. The radar/hexagon chart on the Aptitude
// Analysis page is driven entirely by StudentPloAchievementResponse
// above (real, deterministic) — this type is prose-only interpretation
// shown alongside it, never a source of chart data.
export interface AiSkillAnalysisReport {
  studentProfileId: string;
  generatedAt: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
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
  isRequired: boolean;
  categoryId: string;
  // Raw prerequisite edges + the derived boolean, computed for EVERY
  // course (not just required-and-not-passed) — added for the
  // Prerequisite Flow Chart (F3), which needs the full graph.
  prerequisiteCourseIds: string[];
  isPrerequisiteSatisfied: boolean;
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
  missingRequiredCourses: CourseSummary[];
  categoryProgress: CategoryProgress[];
  graduationReadiness: GraduationReadiness;
}

// ---- Learning Path Planner (GET /learning-path/:studentProfileId) ----
// nextSemesterPlan/availableCourses are prerequisite-satisfied-only,
// credit-capped-at-maxCreditsPerSemester subsets — no pacing/AI-insight
// data exists anywhere backing this (confirmed against the service
// directly); the page must not fabricate either.

// isRequired now lives on CourseSummary itself.
export type AvailableCourse = CourseSummary;

export interface LearningPathReport {
  studentProfileId: string;
  curriculumId: string;
  availableCourses: AvailableCourse[];
  missingRequiredCourses: CourseSummary[];
  incompleteElectiveCategories: IncompleteElectiveCategory[];
  graduationReadiness: GraduationReadiness;
  nextSemesterPlan: AvailableCourse[];
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

export interface SemesterGpa extends GpaSummary {
  semesterId: string;
}

// GET /student-course-records/gpa/:studentProfileId — cumulative GpaSummary
// fields plus a per-semester breakdown. bySemester is grouped from RAW
// records (not retake-deduped like the cumulative gpa above), so a course
// later retaken elsewhere still counts in the semester it was first
// attempted.
export interface GpaResult extends GpaSummary {
  bySemester: SemesterGpa[];
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

// ---- Admin CRUD for AcademicYear/Semester (SUPER_ADMIN only) ----
export interface CreateAcademicYearRequest {
  year: number;
}

export type UpdateAcademicYearRequest = Partial<CreateAcademicYearRequest>;

export interface CreateSemesterRequest {
  term: SemesterTerm;
  academicYearId: string;
}

export interface UpdateSemesterRequest {
  term?: SemesterTerm;
}

// ---- Instructor course roster (GET /courses/:courseId/students) ----
// No email field — the roster intentionally does not expose it.
export interface StudentRosterEntry {
  studentProfileId: string;
  studentCode: string;
  fullName: string;
  grade: Grade;
}

// ---- Instructor dashboard (GET /dashboard/instructor) and course-level
// CLO achievement (GET /clo-achievement/course/:courseId) share this shape.
export interface CloAchievementEntry {
  cloId: string;
  code: string;
  description: string;
  threshold: number;
  isAchieved: boolean;
}

export interface CoursePloEntry {
  ploId: string;
  code: string;
  name: string;
  achievementPercent: number;
  cloBreakdown: { cloId: string; code: string; weight: number }[];
}

export interface InstructorCourseSummary {
  courseId: string;
  code: string;
  name: string;
  studentCount: number; // excludes W/I
  achievementPercent: number; // % graded B or above
  gradeDistribution: Record<Grade, number>; // full raw tally incl. W/I/S/U
  clos: CloAchievementEntry[];
  plos: CoursePloEntry[];
  courseAssessment: {
    courseId: string;
    submissionCount: number;
    clos: { cloId: string; code: string; averageScore: number | null; scoreCount: number }[];
  };
}

export interface InstructorDashboardReport {
  courses: InstructorCourseSummary[];
}

// clos here shares one course-level achievementPercent across every entry
// (a backend/schema limitation, not a frontend bug) — do not try to derive
// per-CLO percentages from it.
export interface CourseCloAchievementReport {
  courseId: string;
  totalStudents: number;
  achievedStudents: number;
  achievementPercent: number;
  clos: CloAchievementEntry[];
}

// ---- Module 12: User Management (SUPER_ADMIN/ADMIN) ----
// Mirrors UserManagementService.toSummary's mapped shape — roles is a
// flat Role[] (from the UserRole relation), scopes is the raw UserScope[]
// relation as-is (no joined faculty/department/program name; the
// frontend resolves names client-side from the already-cached
// GET /faculties, /departments, /programs lists, same as everywhere else
// in this app).

export type ScopeLevel = 'FACULTY' | 'DEPARTMENT' | 'PROGRAM';

export interface UserScope {
  id: string;
  userId: string;
  level: ScopeLevel;
  facultyId: string | null;
  departmentId: string | null;
  programId: string | null;
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  scopes: UserScope[];
}

export interface InitialScope {
  level: ScopeLevel;
  targetId: string;
}

// role:STUDENT is never accepted here — enforced server-side (CreateUserDto
// mirrors this exactly, minus the runtime rejection).
export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: Role;
  scope?: InitialScope;
}

// tempPassword is shown exactly once — there is no way to retrieve or
// regenerate it later (resend-invitation is dead code, see TODO.md).
export interface CreateUserResponse {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tempPassword: string;
}

export interface UpdateUserActiveStatusRequest {
  isActive: boolean;
}

export interface AssignRoleRequest {
  role: Role;
}

export interface CreateUserScopeRequest {
  level: ScopeLevel;
  targetId: string;
}

// ---- STAFF: Student Directory ----

export interface StudentProfileSummary {
  id: string;
  userId: string;
  studentCode: string;
  programId: string;
  curriculumId: string;
  admissionYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string; email: string };
}

// ---- STAFF: picking an instructor for CourseInstructor ----

export interface InstructorListItem {
  id: string;
  fullName: string;
  email: string;
}

// ---- Curriculum content: Course Category ----

export interface CourseCategory {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  curriculumId: string;
}

export interface CreateCourseCategoryRequest {
  name: string;
  code?: string;
  curriculumId: string;
}

export type UpdateCourseCategoryRequest = Partial<
  Pick<CreateCourseCategoryRequest, 'name' | 'code'>
>;

// ---- Curriculum content: Curriculum Requirement (1:1 with CourseCategory) ----

export interface CurriculumRequirement {
  id: string;
  minCredits: number;
  minCourses: number | null;
  createdAt: string;
  updatedAt: string;
  curriculumId: string;
  categoryId: string;
}

export interface CreateCurriculumRequirementRequest {
  curriculumId: string;
  categoryId: string;
  minCredits: number;
  minCourses?: number;
}

export type UpdateCurriculumRequirementRequest = Partial<
  Pick<CreateCurriculumRequirementRequest, 'minCredits' | 'minCourses'>
>;

// ---- Curriculum content: Prerequisite ----

export interface Prerequisite {
  id: string;
  courseId: string;
  prerequisiteCourseId: string;
  groupId: string | null;
  createdAt: string;
}

export interface CreatePrerequisiteRequest {
  courseId: string;
  prerequisiteCourseId: string;
  groupId?: string;
}

export interface UpdatePrerequisiteRequest {
  groupId?: string;
}

// ---- Curriculum content: Course Instructor (assignment) ----

export interface CourseInstructor {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface CreateCourseInstructorRequest {
  userId: string;
  courseId: string;
}

// ---- Curriculum content: Course create/update (STAFF course management) ----

export interface CreateCourseRequest {
  code: string;
  name: string;
  nameEn?: string;
  credits: number;
  description?: string;
  isRequired?: boolean;
  curriculumId: string;
  categoryId: string;
}

export type UpdateCourseRequest = Partial<CreateCourseRequest>;
