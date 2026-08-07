import { Injectable } from '@nestjs/common';
import { RequestUser } from '../auth/request-user.interface';
import { CreditCheckerService } from '../academic-record/credit-checker/credit-checker.service';
import { LearningPathService } from '../academic-record/learning-path/learning-path.service';
import { StudentCourseRecordService } from '../academic-record/student-course-record/student-course-record.service';
import { SEMESTER_TERM_RANK } from '../academic-record/student-course-record/grade-point.constant';
import { CloAchievementService } from '../curriculum-content/clo-achievement/clo-achievement.service';
import { CourseAssessmentService } from '../curriculum-content/course-assessment/course-assessment.service';
import { CourseService } from '../curriculum-content/course/course.service';
import { PloAchievementService } from '../curriculum-content/plo-achievement/plo-achievement.service';
import {
  CurriculumDashboardReport,
  InstructorCourseSummary,
  InstructorDashboardReport,
  RecentCourse,
  StudentDashboardReport,
} from './dashboard-report.interface';

const RECENT_COURSES_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(
    private readonly creditCheckerService: CreditCheckerService,
    private readonly studentCourseRecordService: StudentCourseRecordService,
    private readonly ploAchievementService: PloAchievementService,
    private readonly learningPathService: LearningPathService,
    private readonly courseService: CourseService,
    private readonly cloAchievementService: CloAchievementService,
    private readonly courseAssessmentService: CourseAssessmentService,
  ) {}

  async getStudentDashboard(
    studentProfileId: string,
    user: RequestUser,
  ): Promise<StudentDashboardReport> {
    // Self-ownership enforced here — every call below either reuses this
    // validation (getLatestAttemptsPerCourse takes no ownership check of
    // its own, by design) or independently re-validates the same way
    // (calculateGpa, calculateForStudent, getLearningPath), never a
    // second implementation of the check itself.
    const creditCheck = await this.creditCheckerService.checkCredits(
      studentProfileId,
      user,
    );
    const gpaResult = await this.studentCourseRecordService.calculateGpa(
      studentProfileId,
      user,
    );
    const ploReport = await this.ploAchievementService.calculateForStudent(
      studentProfileId,
      user,
    );
    const learningPath = await this.learningPathService.getLearningPath(
      studentProfileId,
      user,
    );
    const latestByCourse =
      await this.studentCourseRecordService.getLatestAttemptsPerCourse(
        studentProfileId,
      );

    // Lookup for code/name/credits — reuses data checkCredits already
    // fetched (every course the curriculum knows about, cross-referenced
    // with this student's attempts) rather than issuing new queries.
    const courseInfoById = new Map(
      [
        ...creditCheck.passedCourses,
        ...creditCheck.failedCourses,
        ...creditCheck.notYetStudiedCourses,
      ].map((c) => [c.courseId, c]),
    );

    const recentCourses: RecentCourse[] = [...latestByCourse.entries()]
      .sort(([, a], [, b]) => {
        if (a.semester.academicYear.year !== b.semester.academicYear.year) {
          return b.semester.academicYear.year - a.semester.academicYear.year;
        }
        return (
          SEMESTER_TERM_RANK[b.semester.term] -
          SEMESTER_TERM_RANK[a.semester.term]
        );
      })
      .slice(0, RECENT_COURSES_LIMIT)
      .map(([courseId, attempt]) => {
        const info = courseInfoById.get(courseId);
        return {
          courseId,
          code: info?.code ?? '',
          name: info?.name ?? '',
          credits: attempt.credits,
          grade: attempt.grade,
          academicYear: attempt.semester.academicYear.year,
          semesterTerm: attempt.semester.term,
        };
      });

    const curriculumProgressPercent =
      creditCheck.totalCreditsRequired > 0
        ? (creditCheck.creditsPassed / creditCheck.totalCreditsRequired) * 100
        : 0;

    return {
      studentProfileId: creditCheck.studentProfileId,
      gpa: gpaResult.gpa,
      creditsEarned: creditCheck.creditsPassed,
      creditsRemaining: creditCheck.creditsRemaining,
      totalCreditsRequired: creditCheck.totalCreditsRequired,
      curriculumProgressPercent,
      graduationReadiness: creditCheck.graduationReadiness,
      radar: ploReport.radar,
      strengths: ploReport.strengths,
      areasForImprovement: ploReport.areasForImprovement,
      recentCourses,
      missingRequiredCourses: learningPath.missingRequiredCourses,
      incompleteElectiveCategories: learningPath.incompleteElectiveCategories,
      aiSummary: null,
    };
  }

  // Self-scoped — no guard needed beyond @Roles('INSTRUCTOR'), same shape
  // as GET /courses/my-courses.
  async getInstructorDashboard(
    user: RequestUser,
  ): Promise<InstructorDashboardReport> {
    const courses = await this.courseService.findMyCourses(user.userId);

    const courseSummaries: InstructorCourseSummary[] = await Promise.all(
      courses.map(async (course) => {
        const cloReport = await this.cloAchievementService.calculateForCourse(
          course.id,
        );
        const ploReport = await this.ploAchievementService.calculateForCourse(
          course.id,
        );
        const courseAssessment =
          await this.courseAssessmentService.getAggregateForCourse(course.id);
        const latestAttempts =
          await this.studentCourseRecordService.getLatestAttemptsPerStudent(
            course.id,
          );
        const gradeDistribution =
          this.studentCourseRecordService.tallyGradeDistribution(
            latestAttempts,
          );

        return {
          courseId: course.id,
          code: course.code,
          name: course.name,
          studentCount: cloReport.totalStudents,
          achievementPercent: cloReport.achievementPercent,
          gradeDistribution,
          clos: cloReport.clos,
          plos: ploReport.plos,
          courseAssessment,
        };
      }),
    );

    return { courses: courseSummaries };
  }

  async getCurriculumDashboard(
    curriculumId: string,
  ): Promise<CurriculumDashboardReport> {
    const report = await this.ploAchievementService.calculateForCurriculum(
      curriculumId,
    );
    return { ...report, aiCurriculumSummary: null };
  }
}
