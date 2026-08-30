import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { StudentCourseRecordService } from '../../academic-record/student-course-record/student-course-record.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { ScopeResolverService } from '../../../common/scope/scope-resolver.service';
import { RequestUser } from '../../auth/request-user.interface';
import {
  calculateActualCloAchievement,
  CloEvidenceItem,
} from './calculation/calculate-actual-clo';
import {
  calculateActualPloAchievement,
  CloContribution,
} from './calculation/calculate-actual-plo';
import { calculateGap } from './calculation/calculate-gap';
import { AchievementResult, EvidenceStatus, MissingScorePolicy } from './calculation/types';

export interface GapResult {
  actual: AchievementResult;
  selfAssessmentScore: number | null;
  gap: Prisma.Decimal | null;
}

@Injectable()
export class ActualAchievementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentCourseRecordService: StudentCourseRecordService,
    private readonly studentProfileService: StudentProfileService,
    private readonly scopeResolverService: ScopeResolverService,
  ) {}

  // Actual CLO Achievement for one student's one course attempt — the
  // only place StudentAssessmentScore rows are read and fed into the
  // calculation. Self-assessment (CourseAssessmentCloScore) is NEVER
  // queried here; see computeGapForAttempt below for the one place it's
  // used, strictly downstream of this result.
  async computeActualCloForAttempt(
    studentCourseRecordId: string,
    cloId: string,
  ): Promise<AchievementResult> {
    const mappings = await this.prisma.assessmentCloMapping.findMany({
      where: { cloId, isActive: true },
      include: { assessmentDefinition: true },
    });

    if (mappings.length === 0) {
      return calculateActualCloAchievement([]);
    }

    const scores = await this.prisma.studentAssessmentScore.findMany({
      where: {
        studentCourseRecordId,
        assessmentCloMappingId: { in: mappings.map((m) => m.id) },
      },
    });
    const scoreByMappingId = new Map(scores.map((s) => [s.assessmentCloMappingId, s]));

    const items: CloEvidenceItem[] = mappings.map((mapping) => {
      const scoreRow = scoreByMappingId.get(mapping.id);
      return {
        // No row at all means "not yet graded" — same as an explicit
        // PENDING row, never silently skipped out of the item list
        // entirely (that would understate totalCount/coverage).
        score: scoreRow?.score ?? null,
        status: (scoreRow?.status ?? 'PENDING') as EvidenceStatus,
        weight: mapping.weight,
        maxScoreOverride: mapping.maxScoreOverride,
        assessmentMaxScore: mapping.assessmentDefinition.maxScore,
        missingScorePolicy: mapping.assessmentDefinition.missingScorePolicy as MissingScorePolicy,
      };
    });

    return calculateActualCloAchievement(items);
  }

  // Verifies the attempt actually belongs to the given course before
  // computing — the controller's InstructorOrScopeGuard authorizes
  // against the URL's :courseId, so this is what stops a mismatched
  // studentCourseRecordId from ever leaking another course's evidence.
  async computeActualCloForAttemptInCourse(
    courseId: string,
    studentCourseRecordId: string,
    cloId: string,
  ): Promise<AchievementResult> {
    const record = await this.prisma.studentCourseRecord.findUnique({
      where: { id: studentCourseRecordId },
    });
    if (!record || !record.isActive || record.courseId !== courseId) {
      throw new NotFoundException(
        `Student course record ${studentCourseRecordId} not found in course ${courseId}`,
      );
    }
    return this.computeActualCloForAttempt(studentCourseRecordId, cloId);
  }

  // Actual PLO Achievement for one student — aggregates Actual CLO
  // Achievement across every CLO the existing CloPloMapping ties to this
  // PLO, using the student's LATEST attempt per course
  // (StudentCourseRecordService.getLatestAttemptsPerCourse, the same
  // retake-collapsing helper CloAchievementService/PloAchievementService
  // already use — no new retake logic invented here). A CLO whose course
  // the student never took has no attempt to compute from, so it
  // contributes null (NO_EVIDENCE for that CLO), same as a CLO with an
  // attempt but zero graded evidence.
  async computeActualPloForStudent(
    studentProfileId: string,
    ploId: string,
    requester: RequestUser,
  ): Promise<AchievementResult> {
    await this.assertCanViewStudentPlo(studentProfileId, requester);

    const cloPloMappings = await this.prisma.cloPloMapping.findMany({
      where: { ploId, isActive: true },
      include: { clo: true },
    });

    if (cloPloMappings.length === 0) {
      return calculateActualPloAchievement([]);
    }

    const latestAttempts =
      await this.studentCourseRecordService.getLatestAttemptsPerCourse(studentProfileId);

    const contributions: CloContribution[] = [];
    for (const mapping of cloPloMappings) {
      const attempt = latestAttempts.get(mapping.clo.courseId);
      const actualClo = attempt
        ? await this.computeActualCloForAttempt(attempt.id, mapping.cloId)
        : calculateActualCloAchievement([]);
      contributions.push({
        cloId: mapping.cloId,
        actualCloScore: actualClo.score,
        // CloPloMapping.weight is a plain Int in the existing schema
        // (unchanged by this addition) — wrapped here at the boundary so
        // the calculation stays Decimal-safe throughout.
        cloPloWeight: new Prisma.Decimal(mapping.weight),
      });
    }

    return calculateActualPloAchievement(contributions);
  }

  // Gap insight only — computed strictly after computeActualCloForAttempt
  // returns, from a completely separate query
  // (CourseAssessment/CourseAssessmentCloScore, the 1-5 self-assessment
  // table). Never the reverse: self-assessment can never influence the
  // actual value above it.
  async computeGapForAttempt(studentCourseRecordId: string, cloId: string): Promise<GapResult> {
    const actual = await this.computeActualCloForAttempt(studentCourseRecordId, cloId);

    const record = await this.prisma.studentCourseRecord.findUniqueOrThrow({
      where: { id: studentCourseRecordId },
    });
    const selfAssessment = await this.prisma.courseAssessment.findUnique({
      where: {
        studentProfileId_courseId: {
          studentProfileId: record.studentProfileId,
          courseId: record.courseId,
        },
      },
      include: { cloScores: { where: { cloId } } },
    });
    const selfAssessmentScore = selfAssessment?.cloScores[0]?.score ?? null;

    return {
      actual,
      selfAssessmentScore,
      gap: calculateGap(selfAssessmentScore, actual.score),
    };
  }

  // Phase 2.1a — closes the authorization gap GET /actual-plo-achievement/
  // student/:id had in Phase 1 (role-gated only, no scope/ownership check
  // at all). Service-layer, not a guard (CONVENTIONS §3a: this is
  // business logic, and studentProfileId is personal data — every
  // rejection path here must be NotFoundException, never
  // ForbiddenException, so existence is never leaked). Branches are
  // independent `if`s, not `if/else if` — a requester can legitimately
  // hold multiple roles at once (e.g. this project's own SUPER_ADMIN
  // test account is also STUDENT), so SUPER_ADMIN must win regardless of
  // which other checks would also pass, and any other passing branch
  // should short-circuit rather than requiring a specific role to be the
  // requester's "primary" one.
  //
  // Order (cheapest/most-common first, not just role-hierarchy order):
  // SUPER_ADMIN (in-memory, no query) -> STUDENT-self (1 query, the
  // overwhelmingly common caller of this endpoint) -> INSTRUCTOR (1 join
  // query) -> ADMIN (ancestry walk + effective-scopes resolution, the
  // most expensive branch) -> NotFoundException.
  private async assertCanViewStudentPlo(
    studentProfileId: string,
    requester: RequestUser,
  ): Promise<void> {
    if (requester.roles.includes('SUPER_ADMIN')) {
      return;
    }

    if (requester.roles.includes('STUDENT')) {
      const own = await this.studentProfileService.findByUserId(requester.userId);
      if (own.id === studentProfileId) {
        return;
      }
    }

    if (requester.roles.includes('INSTRUCTOR')) {
      // Simplified on purpose (Phase 2 plan, section D.2): "taught any
      // course this student has taken," not filtered down to courses
      // whose CLOs actually map to this specific ploId. Full PLO-specific
      // precision is deferred — this is still a real, bounded teaching
      // relationship, not an open door.
      const taughtAndEnrolled = await this.prisma.courseInstructor.findFirst({
        where: {
          userId: requester.userId,
          course: { studentRecords: { some: { studentProfileId, isActive: true } } },
        },
      });
      if (taughtAndEnrolled) {
        return;
      }
    }

    if (requester.roles.includes('ADMIN')) {
      const ancestry = await this.scopeResolverService.resolveAncestry(
        'studentProfile',
        studentProfileId,
      );
      const effectiveScopes = await this.scopeResolverService.getEffectiveScopes(
        requester.userId,
      );
      if (this.scopeResolverService.isCovered(ancestry, effectiveScopes)) {
        return;
      }
    }

    throw new NotFoundException(`Student profile ${studentProfileId} not found`);
  }
}
