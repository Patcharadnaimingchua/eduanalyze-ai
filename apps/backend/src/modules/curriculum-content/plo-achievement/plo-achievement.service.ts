import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StudentProfile } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestUser } from '../../auth/request-user.interface';
import {
  GRADE_POINTS,
  GRADE_STATUS,
} from '../../academic-record/student-course-record/grade-point.constant';
import {
  LatestCourseAttempt,
  StudentCourseRecordService,
} from '../../academic-record/student-course-record/student-course-record.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { CurriculumService } from '../../organization/curriculum/curriculum.service';
import { CreditCheckerService } from '../../academic-record/credit-checker/credit-checker.service';
import { CloAchievementService } from '../clo-achievement/clo-achievement.service';
import {
  CohortPloAchievementReport,
  CourseAnalyticsEntry,
  CoursePloAchievementReport,
  CoursePloEntry,
  CurriculumPloAchievementReport,
  LowestCloEntry,
  RadarPoint,
  StudentPloAchievementReport,
} from './plo-achievement-report.interface';

const AT_RISK_GPA_THRESHOLD = 2.0;

type PloWithMappings = Prisma.PloGetPayload<{
  include: {
    cloMappings: {
      include: { clo: { select: { id: true; courseId: true } } };
    };
  };
}>;

const STRENGTH_COUNT = 2;

@Injectable()
export class PloAchievementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfileService: StudentProfileService,
    private readonly studentCourseRecordService: StudentCourseRecordService,
    private readonly cloAchievementService: CloAchievementService,
    private readonly curriculumService: CurriculumService,
    private readonly creditCheckerService: CreditCheckerService,
  ) {}

  async calculateForStudent(
    studentProfileId: string,
    user: RequestUser,
  ): Promise<StudentPloAchievementReport> {
    const profile = await this.resolveOwnProfileOrValidate(
      studentProfileId,
      user,
    );

    const plos = await this.prisma.plo.findMany({
      where: { curriculumId: profile.curriculumId, isActive: true },
      include: {
        cloMappings: {
          where: { isActive: true },
          include: { clo: { select: { id: true, courseId: true } } },
        },
      },
    });

    const latestAttemptsByCourse =
      await this.studentCourseRecordService.getLatestAttemptsPerCourse(
        profile.id,
      );

    const radar = this.computeStudentPloScores(plos, latestAttemptsByCourse);
    const { strengths, areasForImprovement } =
      this.rankStrengthsAndWeaknesses(radar);

    return {
      studentProfileId: profile.id,
      curriculumId: profile.curriculumId,
      radar,
      strengths,
      areasForImprovement,
    };
  }

  // Reuses Phase 8's CloAchievementService rather than duplicating its
  // course/curriculum/student-record queries (CONVENTIONS.md §6). Also
  // gets course-existence validation for free (calculateForCourse throws
  // NotFoundException if the course doesn't exist or is inactive).
  async calculateForCourse(courseId: string): Promise<CoursePloAchievementReport> {
    const cloReport = await this.cloAchievementService.calculateForCourse(courseId);

    const mappings = await this.prisma.cloPloMapping.findMany({
      where: {
        isActive: true,
        cloId: { in: cloReport.clos.map((clo) => clo.cloId) },
      },
      include: { plo: true },
    });

    const achievementByClo = new Map(
      cloReport.clos.map((clo) => [clo.cloId, clo]),
    );

    const entriesByPlo = new Map<string, CoursePloEntry>();
    const weightSumByPlo = new Map<string, number>();
    const weightedScoreSumByPlo = new Map<string, number>();

    for (const mapping of mappings) {
      const clo = achievementByClo.get(mapping.cloId);
      if (!clo) {
        continue; // defensive — shouldn't happen, cloId set comes from cloReport itself
      }

      let entry = entriesByPlo.get(mapping.ploId);
      if (!entry) {
        entry = {
          ploId: mapping.plo.id,
          code: mapping.plo.code,
          name: mapping.plo.name,
          achievementPercent: 0,
          cloBreakdown: [],
        };
        entriesByPlo.set(mapping.ploId, entry);
        weightSumByPlo.set(mapping.ploId, 0);
        weightedScoreSumByPlo.set(mapping.ploId, 0);
      }

      entry.cloBreakdown.push({
        cloId: clo.cloId,
        code: clo.code,
        weight: mapping.weight,
      });
      weightSumByPlo.set(
        mapping.ploId,
        weightSumByPlo.get(mapping.ploId)! + mapping.weight,
      );
      weightedScoreSumByPlo.set(
        mapping.ploId,
        weightedScoreSumByPlo.get(mapping.ploId)! +
          cloReport.achievementPercent * mapping.weight,
      );
    }

    // Weighted average of Phase 8's per-CLO achievementPercent. Every CLO
    // of this course currently shares the same achievementPercent (Phase
    // 8 limitation, see TODO.md), so this collapses to that one value
    // regardless of weight today — the formula is still correct and
    // becomes meaningful once CLO-specific grades or cross-course PLO
    // aggregation exist. Don't "simplify" this away.
    const plos = Array.from(entriesByPlo.values()).map((entry) => ({
      ...entry,
      achievementPercent:
        weightedScoreSumByPlo.get(entry.ploId)! / weightSumByPlo.get(entry.ploId)!,
    }));

    return {
      courseId: cloReport.courseId,
      achievementPercent: cloReport.achievementPercent,
      plos,
    };
  }

  // Cohort = (curriculumId, admissionYear) — Plo is Curriculum-scoped, so
  // averaging across different curricula would average numbers that
  // don't refer to the same PLO set at all. No self-ownership here
  // (SUPER_ADMIN-only endpoint, no per-user resolution needed).
  //
  // curriculum.plos is fetched ONCE for the whole cohort, not per
  // student, and getLatestAttemptsPerCourse's result is reused for BOTH
  // GPA and PLO scoring per student (one query, two calculations) — see
  // TODO.md for the accepted N-query-per-cohort limitation this still has
  // (no bulk multi-student attempts query exists yet).
  async calculateForCohort(
    curriculumId: string,
    admissionYear: number,
  ): Promise<CohortPloAchievementReport> {
    await this.curriculumService.findActiveByIdOrThrow(curriculumId);

    const plos = await this.prisma.plo.findMany({
      where: { curriculumId, isActive: true },
      include: {
        cloMappings: {
          where: { isActive: true },
          include: { clo: { select: { id: true, courseId: true } } },
        },
      },
    });

    const students = await this.prisma.studentProfile.findMany({
      where: { curriculumId, admissionYear, isActive: true },
    });

    const gpas: number[] = [];
    const ploSums = new Map<string, { sum: number; count: number }>();

    for (const student of students) {
      const attempts = await this.studentCourseRecordService.getLatestAttemptsPerCourse(
        student.id,
      );

      const { gpa } = this.studentCourseRecordService.calculateGpaFromAttempts(attempts);
      if (gpa !== null) {
        gpas.push(gpa);
      }

      const radar = this.computeStudentPloScores(plos, attempts);
      for (const point of radar) {
        if (point.value === null) {
          continue; // no data for this student/PLO — excluded, not zero
        }
        const entry = ploSums.get(point.ploId) ?? { sum: 0, count: 0 };
        entry.sum += point.value;
        entry.count += 1;
        ploSums.set(point.ploId, entry);
      }
    }

    const radar: RadarPoint[] = plos.map((plo) => {
      const entry = ploSums.get(plo.id);
      return {
        ploId: plo.id,
        code: plo.code,
        name: plo.name,
        value: entry ? entry.sum / entry.count : null,
      };
    });
    const { strengths, areasForImprovement } =
      this.rankStrengthsAndWeaknesses(radar);

    return {
      curriculumId,
      admissionYear,
      studentCount: students.length,
      averageGpa:
        gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null,
      gpaSampleSize: gpas.length,
      radar,
      strengths,
      areasForImprovement,
    };
  }

  // Curriculum-wide analytics — deliberately does NOT call
  // calculateForCohort per distinct admissionYear (that would re-fetch
  // `plos` and re-validate the curriculum once per cohort, AND process
  // every student twice, since cohorts partition the full student set).
  // Instead: fetch plos/curriculum tree/students ONCE, then run a single
  // loop that accumulates into BOTH curriculum-wide and per-cohort
  // buckets simultaneously. calculateForCohort itself is untouched and
  // still serves its own single-cohort endpoint.
  async calculateForCurriculum(
    curriculumId: string,
  ): Promise<CurriculumPloAchievementReport> {
    await this.curriculumService.findActiveByIdOrThrow(curriculumId);

    const plos = await this.prisma.plo.findMany({
      where: { curriculumId, isActive: true },
      include: {
        cloMappings: {
          where: { isActive: true },
          include: { clo: { select: { id: true, courseId: true } } },
        },
      },
    });
    const curriculumTree = await this.creditCheckerService.loadCurriculumTree(
      curriculumId,
    );
    const students = await this.prisma.studentProfile.findMany({
      where: { curriculumId, isActive: true },
    });

    const gpas: number[] = [];
    let studentsAtRiskCount = 0;
    let graduationReadyCount = 0;
    const ploSums = new Map<string, { sum: number; count: number }>();

    const cohortGpas = new Map<number, number[]>();
    const cohortPloSums = new Map<
      number,
      Map<string, { sum: number; count: number }>
    >();

    for (const student of students) {
      const attempts =
        await this.studentCourseRecordService.getLatestAttemptsPerCourse(
          student.id,
        );

      const { gpa } =
        this.studentCourseRecordService.calculateGpaFromAttempts(attempts);
      if (gpa !== null) {
        gpas.push(gpa);
        if (gpa < AT_RISK_GPA_THRESHOLD) {
          studentsAtRiskCount += 1;
        }
        this.pushInto(cohortGpas, student.admissionYear, gpa);
      }

      const { graduationReadiness } = this.creditCheckerService.computeCreditCheck(
        student,
        curriculumTree,
        attempts,
      );
      if (graduationReadiness.isReady) {
        graduationReadyCount += 1;
      }

      const radar = this.computeStudentPloScores(plos, attempts);
      this.accumulateRadar(ploSums, radar);
      const cohortSums =
        cohortPloSums.get(student.admissionYear) ??
        cohortPloSums.set(student.admissionYear, new Map()).get(
          student.admissionYear,
        )!;
      this.accumulateRadar(cohortSums, radar);
    }

    const radar = this.buildRadarFromSums(plos, ploSums);
    const { strengths, areasForImprovement } =
      this.rankStrengthsAndWeaknesses(radar);

    const cohortComparison: CohortPloAchievementReport[] = Array.from(
      cohortGpas.keys(),
    )
      .sort((a, b) => a - b)
      .map((year) => {
        const yearGpas = cohortGpas.get(year) ?? [];
        const yearRadar = this.buildRadarFromSums(
          plos,
          cohortPloSums.get(year) ?? new Map(),
        );
        const ranked = this.rankStrengthsAndWeaknesses(yearRadar);
        return {
          curriculumId,
          admissionYear: year,
          studentCount: students.filter((s) => s.admissionYear === year)
            .length,
          averageGpa: yearGpas.length > 0 ? this.average(yearGpas) : null,
          gpaSampleSize: yearGpas.length,
          radar: yearRadar,
          strengths: ranked.strengths,
          areasForImprovement: ranked.areasForImprovement,
        };
      });

    // Separate data shape from the student loop above — own N₂ query cost,
    // documented as a known limitation in TODO.md (same pattern as the
    // per-student N-query note from Phase 9 Chunk 3).
    const courses = await this.prisma.course.findMany({
      where: { curriculumId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const courseAnalytics: CourseAnalyticsEntry[] = [];
    let lowestAchievement = Infinity;
    let lowestClos: LowestCloEntry[] = [];

    for (const course of courses) {
      const report = await this.cloAchievementService.calculateForCourse(
        course.id,
      );
      courseAnalytics.push({
        courseId: course.id,
        code: course.code,
        name: course.name,
        achievementPercent: report.achievementPercent,
      });

      // Every CLO of this course shares report.achievementPercent — there
      // is no per-CLO percent field on CloAchievementEntry (Phase 8
      // limitation, see TODO.md).
      for (const clo of report.clos) {
        if (report.achievementPercent < lowestAchievement) {
          lowestAchievement = report.achievementPercent;
          lowestClos = [
            {
              cloId: clo.cloId,
              code: clo.code,
              description: clo.description,
              courseId: course.id,
              courseCode: course.code,
              courseName: course.name,
              achievementPercent: report.achievementPercent,
            },
          ];
        } else if (report.achievementPercent === lowestAchievement) {
          lowestClos.push({
            cloId: clo.cloId,
            code: clo.code,
            description: clo.description,
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
            achievementPercent: report.achievementPercent,
          });
        }
      }
    }

    const withData = radar.filter(
      (p): p is RadarPoint & { value: number } => p.value !== null,
    );
    const lowestPlo =
      withData.length > 0
        ? withData.reduce((min, p) => (p.value < min.value ? p : min))
        : null;

    return {
      curriculumId,
      studentCount: students.length,
      averageGpa: gpas.length > 0 ? this.average(gpas) : null,
      gpaSampleSize: gpas.length,
      studentsAtRiskCount,
      graduationReadyCount,
      graduationReadyPercent:
        students.length > 0
          ? (graduationReadyCount / students.length) * 100
          : null,
      radar,
      strengths,
      areasForImprovement,
      lowestPlo,
      lowestClos,
      courseAnalytics,
      cohortComparison,
    };
  }

  private pushInto<K>(map: Map<K, number[]>, key: K, value: number) {
    const existing = map.get(key);
    if (existing) {
      existing.push(value);
    } else {
      map.set(key, [value]);
    }
  }

  private accumulateRadar(
    sums: Map<string, { sum: number; count: number }>,
    radar: RadarPoint[],
  ) {
    for (const point of radar) {
      if (point.value === null) {
        continue; // no data for this student/PLO — excluded, not zero
      }
      const entry = sums.get(point.ploId) ?? { sum: 0, count: 0 };
      entry.sum += point.value;
      entry.count += 1;
      sums.set(point.ploId, entry);
    }
  }

  private buildRadarFromSums(
    plos: PloWithMappings[],
    sums: Map<string, { sum: number; count: number }>,
  ): RadarPoint[] {
    return plos.map((plo) => {
      const entry = sums.get(plo.id);
      return {
        ploId: plo.id,
        code: plo.code,
        name: plo.name,
        value: entry ? entry.sum / entry.count : null,
      };
    });
  }

  private average(values: number[]) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Pure/internal — no I/O, takes already-fetched data. Reusable by
  // Cohort/Curriculum chunks later without re-fetching curriculum.plos
  // per student.
  private computeStudentPloScores(
    plos: PloWithMappings[],
    latestAttemptsByCourse: Map<string, LatestCourseAttempt>,
  ): RadarPoint[] {
    return plos.map((plo) => {
      let weightedScoreSum = 0;
      let weightSum = 0;

      for (const mapping of plo.cloMappings) {
        const score = this.scoreForClo(
          mapping.clo.courseId,
          latestAttemptsByCourse,
        );
        if (score === null) {
          continue; // no data for this CLO — excluded, not zero
        }
        weightedScoreSum += score * mapping.weight;
        weightSum += mapping.weight;
      }

      return {
        ploId: plo.id,
        code: plo.code,
        name: plo.name,
        value: weightSum > 0 ? weightedScoreSum / weightSum : null,
      };
    });
  }

  // Per-student, per-CLO score on a 0-100 scale, keyed off GRADE_STATUS
  // (not GRADE_POINTS alone) — a deliberate divergence from Phase 8's
  // ACHIEVED_GRADES (binary B+/not), since a radar percentage needs a
  // continuous value, not a pass/fail signal.
  //
  // FAIL (F or U) -> 0: counts and drags the PLO down. U is a definite
  // negative outcome, the S/U-scale equivalent of F — excluding it would
  // let a real failure silently vanish from the PLO average.
  // Otherwise, if GRADE_POINTS has a value -> grade/4.0*100.
  // Otherwise (S, W, I) -> excluded (no data): S can't be quantified on a
  // mastery scale; W/I have no final outcome yet.
  private scoreForClo(
    courseId: string,
    latestAttemptsByCourse: Map<string, LatestCourseAttempt>,
  ): number | null {
    const attempt = latestAttemptsByCourse.get(courseId);
    if (!attempt) {
      return null;
    }
    if (GRADE_STATUS[attempt.grade] === 'FAIL') {
      return 0;
    }
    const gradePoint = GRADE_POINTS[attempt.grade];
    return gradePoint === null ? null : (gradePoint / 4.0) * 100;
  }

  private rankStrengthsAndWeaknesses(radar: RadarPoint[]) {
    const withData = radar
      .filter((p): p is RadarPoint & { value: number } => p.value !== null)
      .sort((a, b) => b.value - a.value);

    const strengths = withData.slice(0, STRENGTH_COUNT);
    const remaining = withData.slice(STRENGTH_COUNT);
    const areasForImprovement = remaining
      .slice(-STRENGTH_COUNT)
      .reverse(); // lowest first

    return { strengths, areasForImprovement };
  }

  private isSelfServiceOnly(user: RequestUser) {
    return (
      user.roles.includes('STUDENT') && !user.roles.includes('SUPER_ADMIN')
    );
  }

  private async resolveOwnProfileOrValidate(
    suppliedStudentProfileId: string,
    user: RequestUser,
  ): Promise<StudentProfile> {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      if (own.id !== suppliedStudentProfileId) {
        throw new NotFoundException(
          `Student profile ${suppliedStudentProfileId} not found`,
        );
      }
      return own;
    }
    return this.studentProfileService.findActiveByIdOrThrow(
      suppliedStudentProfileId,
    );
  }
}
