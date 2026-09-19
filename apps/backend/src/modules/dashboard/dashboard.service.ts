import { Injectable } from '@nestjs/common';
import { RequestUser } from '../auth/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeResolverService } from '../../common/scope/scope-resolver.service';
import { CreditCheckerService } from '../academic-record/credit-checker/credit-checker.service';
import { LearningPathService } from '../academic-record/learning-path/learning-path.service';
import { StudentCourseRecordService } from '../academic-record/student-course-record/student-course-record.service';
import {
  SEMESTER_TERM_RANK,
  riskLevel,
} from '../academic-record/student-course-record/grade-point.constant';
import { CloAchievementService } from '../curriculum-content/clo-achievement/clo-achievement.service';
import { CourseAssessmentService } from '../curriculum-content/course-assessment/course-assessment.service';
import { CourseService } from '../curriculum-content/course/course.service';
import { PloAchievementService } from '../curriculum-content/plo-achievement/plo-achievement.service';
import {
  CurriculumDashboardReport,
  InstructorCourseSummary,
  InstructorDashboardReport,
  RecentCourse,
  StaffOverviewCurriculum,
  StaffOverviewReport,
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
    private readonly prisma: PrismaService,
    private readonly scopeResolverService: ScopeResolverService,
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

    const summaries = await Promise.all(
      courses.map(async (course) => {
        const cloReport = await this.cloAchievementService.calculateForCourse(
          course.id,
        );
        const ploReport = await this.ploAchievementService.calculateForCourse(
          course.id,
        );
        const courseAssessment =
          await this.courseAssessmentService.getAggregateForCourse(course.id);
        const records =
          await this.studentCourseRecordService.findActiveRecordsForCourse(
            course.id,
          );
        const latestAttempts =
          this.studentCourseRecordService.dedupeLatestPerStudent(records);
        const gradeDistribution =
          this.studentCourseRecordService.tallyGradeDistribution(
            latestAttempts,
          );

        const atRiskAttempts =
          this.studentCourseRecordService.selectAtRiskAttempts(latestAttempts);

        const semesterTrend =
          this.studentCourseRecordService.summarizeBySemester(records);

        return {
          atRiskAttempts,
          summary: {
            courseId: course.id,
            code: course.code,
            name: course.name,
            studentCount: cloReport.totalStudents,
            achievementPercent: cloReport.achievementPercent,
            achievementThreshold: cloReport.achievementThreshold,
            gradeDistribution,
            clos: cloReport.clos,
            plos: ploReport.plos,
            courseAssessment,
            semesterTrend,
          },
        };
      }),
    );

    // One name lookup across every course, not one per course.
    const atRiskProfileIds = new Set(
      summaries.flatMap(({ atRiskAttempts }) =>
        atRiskAttempts.map((attempt) => attempt.studentProfileId),
      ),
    );
    const profiles =
      atRiskProfileIds.size > 0
        ? await this.prisma.studentProfile.findMany({
            where: { id: { in: [...atRiskProfileIds] } },
            select: {
              id: true,
              studentCode: true,
              user: { select: { fullName: true } },
            },
          })
        : [];
    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const courseSummaries: InstructorCourseSummary[] = summaries.map(
      ({ atRiskAttempts, summary }) => ({
        ...summary,
        atRiskStudents: atRiskAttempts.map((attempt) => {
          const profile = profileById.get(attempt.studentProfileId)!;
          return {
            studentProfileId: attempt.studentProfileId,
            studentCode: profile.studentCode,
            fullName: profile.user.fullName,
            grade: attempt.grade,
            riskLevel: riskLevel(attempt.grade),
            academicYear: attempt.semester.academicYear.year,
            semesterTerm: attempt.semester.term,
          };
        }),
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

  // Lightweight per-program/curriculum overview for STAFF, scoped via
  // getCoveredProgramIds — deliberately does not go through
  // PloAchievementService.calculateForCurriculum (that's the heavier
  // PLO radar/cohort/at-risk report behind /dashboard/curriculum/:id,
  // ADMIN/SUPER_ADMIN only).
  //
  // GPA used to cost one query per student (a loop per curriculum, each
  // calling getLatestAttemptsPerCourse). Scope here can span a whole
  // faculty, so that grew without bound. Students and their records are
  // now each fetched once for the entire scope and grouped in memory —
  // the query count no longer depends on how many students there are.
  async getStaffOverview(user: RequestUser): Promise<StaffOverviewReport> {
    const programIds = await this.scopeResolverService.getCoveredProgramIds(
      user.userId,
    );
    if (programIds.length === 0) {
      return { programs: [] };
    }

    const programs = await this.prisma.program.findMany({
      where: { id: { in: programIds }, isActive: true },
      include: { department: { include: { faculty: true } } },
    });

    const curricula = await this.prisma.curriculum.findMany({
      where: { programId: { in: programIds }, isActive: true },
    });

    const curriculaByProgram = new Map<string, typeof curricula>();
    for (const curriculum of curricula) {
      const list = curriculaByProgram.get(curriculum.programId) ?? [];
      list.push(curriculum);
      curriculaByProgram.set(curriculum.programId, list);
    }

    const gpaByCurriculum = await this.summarizeGpaByCurriculum(
      curricula.map((curriculum) => curriculum.id),
    );

    const overviewPrograms = await Promise.all(
      programs.map(async (program) => ({
        programId: program.id,
        programName: program.name,
        programCode: program.code,
        departmentName: program.department.name,
        facultyName: program.department.faculty.name,
        curricula: await Promise.all(
          (curriculaByProgram.get(program.id) ?? []).map((curriculum) =>
            this.getStaffOverviewCurriculum(
              curriculum.id,
              curriculum.version,
              curriculum.effectiveYear,
              gpaByCurriculum.get(curriculum.id),
            ),
          ),
        ),
      })),
    );

    return { programs: overviewPrograms };
  }

  // Two queries total for the whole scope: every in-scope student, then
  // every one of their active records. Retake collapsing stays in
  // StudentCourseRecordService (dedupeLatestPerCourse) and the GPA math
  // stays in calculateGpaFromAttempts — neither is reimplemented here,
  // per CONVENTIONS.md §6.
  private async summarizeGpaByCurriculum(
    curriculumIds: string[],
  ): Promise<Map<string, { studentCount: number; averageGpa: number | null }>> {
    const students = await this.prisma.studentProfile.findMany({
      where: { curriculumId: { in: curriculumIds }, isActive: true },
      select: { id: true, curriculumId: true },
    });

    const records =
      await this.studentCourseRecordService.findActiveRecordsForStudents(
        students.map((student) => student.id),
      );
    const recordsByStudent = new Map<string, typeof records>();
    for (const record of records) {
      const list = recordsByStudent.get(record.studentProfileId) ?? [];
      list.push(record);
      recordsByStudent.set(record.studentProfileId, list);
    }

    const gpasByCurriculum = new Map<string, (number | null)[]>();
    for (const student of students) {
      const latestByCourse =
        this.studentCourseRecordService.dedupeLatestPerCourse(
          recordsByStudent.get(student.id) ?? [],
        );
      const { gpa } =
        this.studentCourseRecordService.calculateGpaFromAttempts(
          latestByCourse,
        );
      const list = gpasByCurriculum.get(student.curriculumId) ?? [];
      list.push(gpa);
      gpasByCurriculum.set(student.curriculumId, list);
    }

    const summary = new Map<
      string,
      { studentCount: number; averageGpa: number | null }
    >();
    for (const [curriculumId, gpas] of gpasByCurriculum) {
      const gradedGpas = gpas.filter((gpa): gpa is number => gpa !== null);
      summary.set(curriculumId, {
        studentCount: gpas.length,
        averageGpa:
          gradedGpas.length > 0
            ? gradedGpas.reduce((sum, gpa) => sum + gpa, 0) / gradedGpas.length
            : null,
      });
    }
    return summary;
  }

  private async getStaffOverviewCurriculum(
    curriculumId: string,
    version: string,
    effectiveYear: number,
    // Absent when the curriculum enrolls nobody — no students means no
    // entry in the grouped map, not a zero-length one.
    gpaSummary: { studentCount: number; averageGpa: number | null } | undefined,
  ): Promise<StaffOverviewCurriculum> {
    const [totalCourses, coursesWithoutClo] = await Promise.all([
      this.prisma.course.count({ where: { curriculumId, isActive: true } }),
      this.prisma.course.count({
        where: {
          curriculumId,
          isActive: true,
          clos: { none: { isActive: true } },
        },
      }),
    ]);

    return {
      curriculumId,
      version,
      effectiveYear,
      studentCount: gpaSummary?.studentCount ?? 0,
      averageGpa: gpaSummary?.averageGpa ?? null,
      totalCourses,
      coursesWithoutClo,
    };
  }
}
