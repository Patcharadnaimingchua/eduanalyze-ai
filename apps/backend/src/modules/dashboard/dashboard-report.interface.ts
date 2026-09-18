import { Grade } from '@prisma/client';
import { GraduationReadiness } from '../academic-record/credit-checker/credit-checker-report.interface';
import { RadarPoint } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';
import { LearningPathReport } from '../academic-record/learning-path/learning-path-report.interface';
import { CourseCloAchievementReport } from '../curriculum-content/clo-achievement/clo-achievement-report.interface';
import { CoursePloAchievementReport } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';
import { CurriculumPloAchievementReport } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';
import { CourseAssessmentService } from '../curriculum-content/course-assessment/course-assessment.service';
import { SemesterAchievement } from '../academic-record/student-course-record/student-course-record.service';

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

export interface StaffOverviewReport {
  programs: StaffOverviewProgram[];
}
