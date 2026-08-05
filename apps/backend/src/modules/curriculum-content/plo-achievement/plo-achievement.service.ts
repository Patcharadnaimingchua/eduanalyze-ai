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
import {
  RadarPoint,
  StudentPloAchievementReport,
} from './plo-achievement-report.interface';

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
