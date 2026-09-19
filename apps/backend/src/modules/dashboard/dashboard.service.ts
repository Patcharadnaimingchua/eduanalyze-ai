import { Injectable } from '@nestjs/common';
import { Clo, Course, Grade, Prisma, StudentProfile } from '@prisma/client';
import { RequestUser } from '../auth/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeResolverService } from '../../common/scope/scope-resolver.service';
import {
  CreditCheckCurriculumTree,
  CreditCheckerService,
} from '../academic-record/credit-checker/credit-checker.service';
import { LearningPathService } from '../academic-record/learning-path/learning-path.service';
import {
  LatestCourseAttempt,
  StudentCourseRecordService,
} from '../academic-record/student-course-record/student-course-record.service';
import {
  RiskLevel,
  SEMESTER_TERM_RANK,
  riskLevel,
} from '../academic-record/student-course-record/grade-point.constant';
import { CloAchievementService } from '../curriculum-content/clo-achievement/clo-achievement.service';
import { CourseAssessmentService } from '../curriculum-content/course-assessment/course-assessment.service';
import { CourseService } from '../curriculum-content/course/course.service';
import {
  PloAchievementService,
  PloWithMappings,
} from '../curriculum-content/plo-achievement/plo-achievement.service';
import {
  CurriculumDashboardReport,
  CurriculumDataState,
  InstructorCourseSummary,
  InstructorDashboardReport,
  ProblematicCloEntry,
  ProblematicPloEntry,
  RecentCourse,
  StaffAtRiskStudent,
  StaffOverviewCurriculum,
  StaffOverviewReport,
  StaffStudentRiskEntry,
  StudentDashboardReport,
  SystemCurriculumEntry,
  SystemCurriculumOverviewReport,
} from './dashboard-report.interface';
import { RadarPoint } from '../curriculum-content/plo-achievement/plo-achievement-report.interface';

const RECENT_COURSES_LIMIT = 5;
// The dashboard card is a prompt to act, not a register. The directory
// carries the full list, filtered by risk.
const STAFF_AT_RISK_LIMIT = 20;
// Same bar PloAchievementService applies per curriculum — a GPA below
// this counts as at risk, and a null GPA does not ("no data" is not
// "at risk").
const AT_RISK_GPA_THRESHOLD = 2.0;

type CurriculumWithProgram = Prisma.CurriculumGetPayload<{
  include: { program: { select: { code: true; name: true } } };
}>;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const item of items) {
    const group = grouped.get(key(item));
    if (group) {
      group.push(item);
    } else {
      grouped.set(key(item), [item]);
    }
  }
  return grouped;
}

// A curriculum with courses but no students is mid-setup, not failing.
// Treating both as "0%" is what makes an untouched dashboard look broken.
function resolveDataState(
  studentCount: number,
  courseCount: number,
  ploCount: number,
): CurriculumDataState {
  if (studentCount > 0) return 'HAS_STUDENTS';
  if (courseCount > 0 || ploCount > 0) return 'STRUCTURE_ONLY';
  return 'EMPTY';
}

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

  // System-wide counterpart to getCurriculumDashboard — every active
  // curriculum at once, for SUPER_ADMIN. Deliberately does NOT loop
  // calculateForCurriculum: that is ~13 queries per curriculum even after
  // batching, which would still multiply by however many curricula exist.
  // Instead everything is fetched once across all curricula (8 queries
  // total, independent of curricula/students/courses) and the same pure
  // PLO and achievement helpers are applied in memory.
  async getSystemCurriculumOverview(): Promise<SystemCurriculumOverviewReport> {
    const curricula = await this.prisma.curriculum.findMany({
      where: { isActive: true },
      include: { program: { select: { code: true, name: true } } },
      orderBy: [{ program: { code: 'asc' } }, { version: 'asc' }],
    });
    if (curricula.length === 0) {
      return {
        totals: {
          curriculumCount: 0,
          curriculaWithStudentsCount: 0,
          studentCount: 0,
          graduationReadyCount: 0,
          graduationReadyPercent: null,
          studentsAtRiskCount: 0,
        },
        curricula: [],
        problematicPlos: [],
        problematicClos: [],
      };
    }
    const curriculumIds = curricula.map((curriculum) => curriculum.id);

    const [plos, students, courses, curriculumTrees] = await Promise.all([
      this.prisma.plo.findMany({
        where: { curriculumId: { in: curriculumIds }, isActive: true },
        include: {
          cloMappings: {
            where: { isActive: true },
            include: { clo: { select: { id: true, courseId: true } } },
          },
        },
      }),
      this.prisma.studentProfile.findMany({
        where: { curriculumId: { in: curriculumIds }, isActive: true },
      }),
      this.prisma.course.findMany({
        where: { curriculumId: { in: curriculumIds }, isActive: true },
        orderBy: { code: 'asc' },
      }),
      this.creditCheckerService.loadCurriculumTrees(curriculumIds),
    ]);

    const courseIds = courses.map((course) => course.id);
    const [studentRecords, courseRecords, clos] = await Promise.all([
      this.studentCourseRecordService.findActiveRecordsForStudents(
        students.map((student) => student.id),
      ),
      this.studentCourseRecordService.findActiveRecordsForCourses(courseIds),
      this.prisma.clo.findMany({
        where: { courseId: { in: courseIds }, isActive: true },
      }),
    ]);

    const recordsByStudent = groupBy(studentRecords, (r) => r.studentProfileId);
    const recordsByCourse = groupBy(courseRecords, (r) => r.courseId);
    const studentsByCurriculum = groupBy(students, (s) => s.curriculumId);
    const coursesByCurriculum = groupBy(courses, (c) => c.curriculumId);
    const closByCourse = groupBy(clos, (c) => c.courseId);
    const plosByCurriculum = groupBy(plos, (p) => p.curriculumId);

    // Course-level achievement once for every course in the system. Keeps
    // totalStudents so a course nobody has taken stays distinguishable
    // from one everybody failed — summarizeCourseAchievement reports 0%
    // for both.
    const achievementByCourse = new Map(
      courses.map((course) => [
        course.id,
        this.cloAchievementService.summarizeCourseAchievement(
          this.studentCourseRecordService.dedupeLatestPerStudent(
            recordsByCourse.get(course.id) ?? [],
          ),
        ),
      ]),
    );

    const { problematicClos, cloBelowThreshold } = this.collectProblematicClos(
      curricula,
      coursesByCurriculum,
      closByCourse,
      achievementByCourse,
    );

    const entries: SystemCurriculumEntry[] = [];
    const problematicPlos: ProblematicPloEntry[] = [];
    let totalGraduationReady = 0;
    let totalAtRisk = 0;

    for (const curriculum of curricula) {
      const curriculumPlos = plosByCurriculum.get(curriculum.id) ?? [];
      const entry = this.summarizeCurriculum({
        curriculum,
        students: studentsByCurriculum.get(curriculum.id) ?? [],
        courses: coursesByCurriculum.get(curriculum.id) ?? [],
        plos: curriculumPlos,
        tree: curriculumTrees.get(curriculum.id),
        recordsByStudent,
        closByCourse,
      });

      problematicPlos.push(
        ...this.selectProblematicPlos(
          curriculum,
          curriculumPlos,
          entry.radar,
          cloBelowThreshold,
        ),
      );

      totalGraduationReady += entry.graduationReadyCount;
      totalAtRisk += entry.studentsAtRiskCount;
      entries.push(entry);
    }

    // Worst first within the group that has students; everything else
    // keeps the program/version order it was fetched in.
    entries.sort((a, b) => {
      if (a.studentCount > 0 !== b.studentCount > 0) {
        return a.studentCount > 0 ? -1 : 1;
      }
      return (a.averagePloValue ?? Infinity) - (b.averagePloValue ?? Infinity);
    });
    problematicPlos.sort(
      (a, b) =>
        b.closBelowThreshold / b.totalMeasuredClos -
        a.closBelowThreshold / a.totalMeasuredClos,
    );

    return {
      totals: {
        curriculumCount: curricula.length,
        curriculaWithStudentsCount: entries.filter((e) => e.studentCount > 0)
          .length,
        studentCount: students.length,
        graduationReadyCount: totalGraduationReady,
        graduationReadyPercent:
          students.length > 0
            ? (totalGraduationReady / students.length) * 100
            : null,
        studentsAtRiskCount: totalAtRisk,
      },
      curricula: entries,
      problematicPlos,
      problematicClos,
    };
  }

  // A CLO inherits its course's single achievementPercent (Phase 8
  // limitation), so this is really "which courses sit below the bar",
  // reported at CLO granularity. Courses nobody has taken are skipped
  // entirely rather than counted as 0% failures, and stay absent from
  // cloBelowThreshold so the PLO rollup can tell "not measured" from
  // "measured and failing".
  private collectProblematicClos(
    curricula: CurriculumWithProgram[],
    coursesByCurriculum: Map<string, Course[]>,
    closByCourse: Map<string, Clo[]>,
    achievementByCourse: Map<string, { totalStudents: number; achievementPercent: number }>,
  ): {
    problematicClos: ProblematicCloEntry[];
    cloBelowThreshold: Map<string, boolean>;
  } {
    const problematicClos: ProblematicCloEntry[] = [];
    const cloBelowThreshold = new Map<string, boolean>();

    for (const curriculum of curricula) {
      for (const course of coursesByCurriculum.get(curriculum.id) ?? []) {
        const achievement = achievementByCourse.get(course.id);
        if (!achievement || achievement.totalStudents === 0) continue;

        for (const clo of closByCourse.get(course.id) ?? []) {
          const threshold =
            clo.achievementThreshold ?? curriculum.defaultAchievementThreshold;
          const isBelow = achievement.achievementPercent < threshold;
          cloBelowThreshold.set(clo.id, isBelow);
          if (!isBelow) continue;

          problematicClos.push({
            cloId: clo.id,
            code: clo.code,
            description: clo.description,
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
            curriculumId: curriculum.id,
            curriculumVersion: curriculum.version,
            programCode: curriculum.program.code,
            achievementPercent: achievement.achievementPercent,
            threshold,
          });
        }
      }
    }

    problematicClos.sort((a, b) => a.achievementPercent - b.achievementPercent);
    return { problematicClos, cloBelowThreshold };
  }

  // Flagged when at least half of a PLO's measurable CLOs are below
  // their threshold. The counts travel with the verdict so the UI can
  // show the evidence instead of an unexplained red badge.
  private selectProblematicPlos(
    curriculum: CurriculumWithProgram,
    plos: PloWithMappings[],
    radar: RadarPoint[],
    cloBelowThreshold: Map<string, boolean>,
  ): ProblematicPloEntry[] {
    const flagged: ProblematicPloEntry[] = [];

    for (const plo of plos) {
      let below = 0;
      let measured = 0;
      for (const mapping of plo.cloMappings) {
        const isBelow = cloBelowThreshold.get(mapping.clo.id);
        if (isBelow === undefined) continue; // course never taken
        measured += 1;
        if (isBelow) below += 1;
      }
      if (measured === 0 || below * 2 < measured) continue;

      flagged.push({
        ploId: plo.id,
        code: plo.code,
        name: plo.name,
        curriculumId: curriculum.id,
        curriculumVersion: curriculum.version,
        programCode: curriculum.program.code,
        closBelowThreshold: below,
        totalMeasuredClos: measured,
        averageValue: radar.find((r) => r.ploId === plo.id)?.value ?? null,
      });
    }
    return flagged;
  }

  // One curriculum's student-derived numbers, computed entirely from
  // records already in memory. Mirrors what calculateForCurriculum does
  // for a single curriculum, minus the cohort split and course analytics
  // this overview doesn't show.
  private summarizeCurriculum({
    curriculum,
    students,
    courses,
    plos,
    tree,
    recordsByStudent,
    closByCourse,
  }: {
    curriculum: CurriculumWithProgram;
    students: StudentProfile[];
    courses: Course[];
    plos: PloWithMappings[];
    tree: CreditCheckCurriculumTree | undefined;
    recordsByStudent: Map<string, LatestCourseAttempt[]>;
    closByCourse: Map<string, Clo[]>;
  }): SystemCurriculumEntry {
    const gpas: number[] = [];
    let studentsAtRiskCount = 0;
    let graduationReadyCount = 0;
    const ploSums = new Map<string, { sum: number; count: number }>();

    for (const student of students) {
      const attempts = this.studentCourseRecordService.dedupeLatestPerCourse(
        recordsByStudent.get(student.id) ?? [],
      );

      const { gpa } =
        this.studentCourseRecordService.calculateGpaFromAttempts(attempts);
      if (gpa !== null) {
        gpas.push(gpa);
        if (gpa < AT_RISK_GPA_THRESHOLD) studentsAtRiskCount += 1;
      }

      // A curriculum with no requirement tree can't be graduated from,
      // so readiness stays 0 rather than defaulting to "ready".
      if (tree) {
        const { graduationReadiness } =
          this.creditCheckerService.computeCreditCheck(student, tree, attempts);
        if (graduationReadiness.isReady) graduationReadyCount += 1;
      }

      this.ploAchievementService.accumulateRadar(
        ploSums,
        this.ploAchievementService.computeStudentPloScores(plos, attempts),
      );
    }

    const radar = this.ploAchievementService.buildRadarFromSums(plos, ploSums);
    const measured = radar.filter(
      (point): point is RadarPoint & { value: number } => point.value !== null,
    );

    return {
      curriculumId: curriculum.id,
      version: curriculum.version,
      effectiveYear: curriculum.effectiveYear,
      programCode: curriculum.program.code,
      programName: curriculum.program.name,
      dataState: resolveDataState(students.length, courses.length, plos.length),
      studentCount: students.length,
      courseCount: courses.length,
      cloCount: courses.reduce(
        (sum, course) => sum + (closByCourse.get(course.id)?.length ?? 0),
        0,
      ),
      ploCount: plos.length,
      averageGpa: gpas.length > 0 ? average(gpas) : null,
      studentsAtRiskCount,
      graduationReadyCount,
      averagePloValue:
        measured.length > 0
          ? average(measured.map((point) => point.value))
          : null,
      radar,
    };
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
      return {
        programs: [],
        atRiskStudents: [],
        atRiskSummary: { critical: 0, watch: 0 },
      };
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

    const { gpaByCurriculum, atRiskStudents, atRiskSummary } =
      await this.summarizeStudentsInScope(programs, curricula);

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

    return {
      programs: overviewPrograms,
      atRiskStudents: atRiskStudents.slice(0, STAFF_AT_RISK_LIMIT),
      atRiskSummary,
    };
  }

  // Two queries for the whole scope — every in-scope student, then every
  // one of their active records — and both the GPA average and the
  // at-risk roll-up come off that same pass.
  //
  // Retake collapsing stays in dedupeLatestPerCourse, the GPA math in
  // calculateGpaFromAttempts, and the at-risk selection in
  // selectAtRiskAttempts. None is reimplemented here (CONVENTIONS.md §6),
  // which is what keeps a staff CRITICAL and an instructor CRITICAL the
  // same claim about the same student.
  private async summarizeStudentsInScope(
    programs: { id: string; code: string }[],
    curricula: { id: string; version: string }[],
  ): Promise<{
    gpaByCurriculum: Map<
      string,
      { studentCount: number; averageGpa: number | null }
    >;
    atRiskStudents: StaffAtRiskStudent[];
    atRiskSummary: { critical: number; watch: number };
  }> {
    const students = await this.prisma.studentProfile.findMany({
      where: {
        curriculumId: { in: curricula.map((curriculum) => curriculum.id) },
        isActive: true,
      },
      select: {
        id: true,
        curriculumId: true,
        programId: true,
        studentCode: true,
        user: { select: { fullName: true } },
      },
    });

    const riskByStudent = await this.computeStudentRisk(
      students.map((student) => student.id),
    );

    const programCodeById = new Map(programs.map((p) => [p.id, p.code]));
    const versionByCurriculumId = new Map(
      curricula.map((curriculum) => [curriculum.id, curriculum.version]),
    );

    const gpasByCurriculum = new Map<string, (number | null)[]>();
    const atRiskStudents: StaffAtRiskStudent[] = [];
    const atRiskSummary = { critical: 0, watch: 0 };

    for (const student of students) {
      const risk = riskByStudent.get(student.id)!;

      const gpas = gpasByCurriculum.get(student.curriculumId) ?? [];
      gpas.push(risk.gpa);
      gpasByCurriculum.set(student.curriculumId, gpas);

      if (risk.worstGrade === null) continue;

      if (risk.riskLevel === 'CRITICAL') atRiskSummary.critical += 1;
      else if (risk.riskLevel === 'WATCH') atRiskSummary.watch += 1;

      atRiskStudents.push({
        studentProfileId: student.id,
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        riskLevel: risk.riskLevel,
        worstGrade: risk.worstGrade,
        atRiskCourseCount: risk.atRiskCourseCount,
        gpa: risk.gpa,
        programCode: programCodeById.get(student.programId) ?? '',
        curriculumVersion:
          versionByCurriculumId.get(student.curriculumId) ?? '',
      });
    }

    // CRITICAL above WATCH, then most courses affected — the cap below
    // has to keep the students worth looking at first.
    atRiskStudents.sort(
      (a, b) =>
        Number(b.riskLevel === 'CRITICAL') - Number(a.riskLevel === 'CRITICAL') ||
        b.atRiskCourseCount - a.atRiskCourseCount,
    );

    const gpaByCurriculum = new Map<
      string,
      { studentCount: number; averageGpa: number | null }
    >();
    for (const [curriculumId, gpas] of gpasByCurriculum) {
      const gradedGpas = gpas.filter((gpa): gpa is number => gpa !== null);
      gpaByCurriculum.set(curriculumId, {
        studentCount: gpas.length,
        averageGpa:
          gradedGpas.length > 0
            ? gradedGpas.reduce((sum, gpa) => sum + gpa, 0) / gradedGpas.length
            : null,
      });
    }

    return { gpaByCurriculum, atRiskStudents, atRiskSummary };
  }

  // One query for a whole cohort's records, then per student: collapse
  // retakes, average, and pick the worst at-risk attempt. Every step is
  // an existing StudentCourseRecordService method — this only groups
  // their inputs (CONVENTIONS.md §6).
  //
  // selectAtRiskAttempts returns worst-first, so [0] decides the band.
  // There is deliberately no separate "student is at risk when…" rule to
  // drift away from the per-course one the instructor dashboard uses.
  private async computeStudentRisk(studentProfileIds: string[]): Promise<
    Map<
      string,
      {
        gpa: number | null;
        riskLevel: RiskLevel;
        worstGrade: Grade | null;
        atRiskCourseCount: number;
      }
    >
  > {
    const records =
      await this.studentCourseRecordService.findActiveRecordsForStudents(
        studentProfileIds,
      );
    const recordsByStudent = new Map<string, typeof records>();
    for (const record of records) {
      const list = recordsByStudent.get(record.studentProfileId) ?? [];
      list.push(record);
      recordsByStudent.set(record.studentProfileId, list);
    }

    const riskByStudent = new Map<
      string,
      {
        gpa: number | null;
        riskLevel: RiskLevel;
        worstGrade: Grade | null;
        atRiskCourseCount: number;
      }
    >();
    for (const studentProfileId of studentProfileIds) {
      const latestByCourse =
        this.studentCourseRecordService.dedupeLatestPerCourse(
          recordsByStudent.get(studentProfileId) ?? [],
        );
      const { gpa } =
        this.studentCourseRecordService.calculateGpaFromAttempts(
          latestByCourse,
        );
      const atRiskAttempts =
        this.studentCourseRecordService.selectAtRiskAttempts(latestByCourse);
      const worst = atRiskAttempts[0];

      riskByStudent.set(studentProfileId, {
        gpa,
        riskLevel: worst ? riskLevel(worst.grade) : 'NORMAL',
        worstGrade: worst?.grade ?? null,
        atRiskCourseCount: atRiskAttempts.length,
      });
    }
    return riskByStudent;
  }

  // The risk-annotated student list behind the staff directory. Scoped by
  // programId to match GET /student-profiles, which this replaces on that
  // page, and deliberately NOT filtered to isActive — the directory shows
  // suspended students with a status badge, unlike the dashboard's
  // enrolment aggregates.
  async getStaffStudentRisk(
    user: RequestUser,
  ): Promise<StaffStudentRiskEntry[]> {
    const programIds = await this.scopeResolverService.getCoveredProgramIds(
      user.userId,
    );
    if (programIds.length === 0) return [];

    const students = await this.prisma.studentProfile.findMany({
      where: { programId: { in: programIds } },
      select: {
        id: true,
        studentCode: true,
        programId: true,
        curriculumId: true,
        admissionYear: true,
        isActive: true,
        user: { select: { fullName: true } },
      },
    });

    const riskByStudent = await this.computeStudentRisk(
      students.map((student) => student.id),
    );

    return students.map((student) => {
      const risk = riskByStudent.get(student.id)!;
      return {
        studentProfileId: student.id,
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        programId: student.programId,
        curriculumId: student.curriculumId,
        admissionYear: student.admissionYear,
        isActive: student.isActive,
        riskLevel: risk.riskLevel,
        gpa: risk.gpa,
        atRiskCourseCount: risk.atRiskCourseCount,
      };
    });
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
