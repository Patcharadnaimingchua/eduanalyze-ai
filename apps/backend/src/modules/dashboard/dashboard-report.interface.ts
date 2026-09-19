import { Grade } from '@prisma/client';
import { GraduationReadiness } from '../academic-record/credit-checker/credit-checker-report.interface';
import { RadarPoint } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';
import { LearningPathReport } from '../academic-record/learning-path/learning-path-report.interface';
import { CourseCloAchievementReport } from '../curriculum-content/clo-achievement/clo-achievement-report.interface';
import { CoursePloAchievementReport } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';
import { CurriculumPloAchievementReport } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';
import { CourseAssessmentService } from '../curriculum-content/course-assessment/course-assessment.service';
import { SemesterAchievement } from '../academic-record/student-course-record/student-course-record.service';
import { RiskLevel } from '../academic-record/student-course-record/grade-point.constant';

export interface RecentCourse {
  courseId: string;
  code: string;
  name: string;
  credits: number;
  grade: Grade;
  academicYear: number;
  semesterTerm: string;
}

export interface StudentDashboardReport {
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
  missingRequiredCourses: LearningPathReport['missingRequiredCourses'];
  incompleteElectiveCategories: LearningPathReport['incompleteElectiveCategories'];
  // Module 7 (AI Skill Analysis) hasn't started — left null, not omitted,
  // so the frontend has a stable field to check rather than an optional
  // one that silently disappears (PROJECT_CONTEXT.md §25/§26: AI only
  // interprets already-computed numbers, never invents them).
  aiSummary: null;
}

export interface AtRiskStudent {
  studentProfileId: string;
  studentCode: string;
  fullName: string;
  grade: Grade;
  // Always CRITICAL or WATCH here — this list is already filtered to
  // AT_RISK_GRADES, and those two bands are exactly its partition.
  riskLevel: RiskLevel;
  academicYear: number;
  semesterTerm: string;
}

export interface InstructorCourseSummary {
  courseId: string;
  code: string;
  name: string;
  studentCount: number;
  // Latest attempt graded C or below (AT_RISK_GRADES), worst first.
  atRiskStudents: AtRiskStudent[];
  // "% B ขึ้นไป" per §30 — pass-through of Phase 8's course-level %.
  achievementPercent: number;
  // The bar achievementPercent is judged against, so the UI never has to
  // invent its own fixed bands.
  achievementThreshold: number;
  // Full A-F (+W/I/S/U) tally per §30's "Grade Distribution" — raw counts,
  // not pre-filtered like achievementPercent above.
  gradeDistribution: Record<Grade, number>;
  clos: CourseCloAchievementReport['clos'];
  plos: CoursePloAchievementReport['plos'];
  courseAssessment: Awaited<
    ReturnType<CourseAssessmentService['getAggregateForCourse']>
  >;
  // One point per semester with >=1 non-W/I record, sorted chronologically.
  semesterTrend: SemesterAchievement[];
}

export interface InstructorDashboardReport {
  courses: InstructorCourseSummary[];
}

export interface CurriculumDashboardReport extends CurriculumPloAchievementReport {
  // Module 7 hasn't started — same null-not-omitted reasoning as above.
  aiCurriculumSummary: null;
}

export interface StaffOverviewCurriculum {
  curriculumId: string;
  version: string;
  effectiveYear: number;
  studentCount: number;
  // null when no student in this curriculum has a graded course yet —
  // same convention as GpaSummary.gpa (not 0, which would misread as F).
  averageGpa: number | null;
  totalCourses: number;
  coursesWithoutClo: number;
}

export interface StaffOverviewProgram {
  programId: string;
  programName: string;
  programCode: string;
  departmentName: string;
  facultyName: string;
  curricula: StaffOverviewCurriculum[];
}

// One row per student, not per attempt — staff act on people, where an
// instructor acts on a course. riskLevel is the band of the student's
// worst latest attempt, which is the same riskLevel() the instructor
// dashboard applies per course, so a student failing one course reads as
// CRITICAL in both places.
export interface StaffAtRiskStudent {
  studentProfileId: string;
  studentCode: string;
  fullName: string;
  // Never NORMAL — this list is already filtered to at-risk grades.
  riskLevel: RiskLevel;
  // The grade that set riskLevel, and how many courses are at risk at
  // all: one D+ reads very differently from six.
  worstGrade: Grade;
  atRiskCourseCount: number;
  gpa: number | null;
  // A scope can span programs, so a name alone doesn't say where to look.
  programCode: string;
  curriculumVersion: string;
}

// The directory's row: every student in scope, at-risk or not, so the
// page can filter by band. riskLevel is NORMAL here for most students,
// unlike StaffAtRiskStudent which is pre-filtered.
export interface StaffStudentRiskEntry {
  studentProfileId: string;
  studentCode: string;
  fullName: string;
  programId: string;
  curriculumId: string;
  admissionYear: number;
  isActive: boolean;
  riskLevel: RiskLevel;
  gpa: number | null;
  atRiskCourseCount: number;
}

export interface StaffOverviewReport {
  programs: StaffOverviewProgram[];
  // Capped — a FACULTY scope covers every program in the faculty, so this
  // is a worst-first preview, not the full set. Counts below are of the
  // whole scope; the student directory holds the complete list.
  atRiskStudents: StaffAtRiskStudent[];
  atRiskSummary: { critical: number; watch: number };
}
