import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssessmentCloMappingService } from './assessment-clo-mapping.service';
import { AssessmentDefinitionService } from './assessment-definition.service';
import { resolveEffectiveMax } from './calculation/normalize-score';
import { BulkUpsertStudentAssessmentScoresDto } from './dto/bulk-upsert-student-assessment-scores.dto';
import { UpsertStudentAssessmentScoreDto } from './dto/upsert-student-assessment-score.dto';

const MAX_REPORTED_ERRORS = 20;

@Injectable()
export class StudentAssessmentScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assessmentCloMappingService: AssessmentCloMappingService,
    private readonly assessmentDefinitionService: AssessmentDefinitionService,
  ) {}

  async upsert(dto: UpsertStudentAssessmentScoreDto) {
    await this.assessmentCloMappingService.assertBelongsToCourse(
      dto.assessmentCloMappingId,
      dto.courseId,
    );
    await this.assertStudentCourseRecordInCourse(dto.studentCourseRecordId, dto.courseId);
    this.assertScorePresenceMatchesStatus(dto.status, dto.score);

    const key = {
      assessmentCloMappingId_studentCourseRecordId: {
        assessmentCloMappingId: dto.assessmentCloMappingId,
        studentCourseRecordId: dto.studentCourseRecordId,
      },
    };
    const data = {
      score: dto.score ?? null,
      status: dto.status,
      assessmentCloMappingId: dto.assessmentCloMappingId,
      studentCourseRecordId: dto.studentCourseRecordId,
    };

    // StudentAssessmentScore has no isActive field (see schema comment),
    // so unlike every other "assert available then create" pattern in
    // this codebase, a genuine schema-level @@unique exists here and a
    // real upsert() is safe to use.
    return this.prisma.studentAssessmentScore.upsert({
      where: key,
      update: data,
      create: data,
    });
  }

  // All-or-nothing write of the same entries to several CLO mappings of ONE
  // assessment. Everything is validated against the DB first and every
  // problem is reported together, so a bad row can never leave the batch
  // half-applied; the writes then go through a single $transaction.
  // Idempotent (real upserts on the unique key), so a retry after an
  // unknown outcome is safe.
  async bulkUpsert(dto: BulkUpsertStudentAssessmentScoresDto) {
    await this.assessmentDefinitionService.assertBelongsToCourse(
      dto.assessmentDefinitionId,
      dto.courseId,
    );

    const mappings = await this.prisma.assessmentCloMapping.findMany({
      where: {
        id: { in: dto.assessmentCloMappingIds },
        assessmentDefinitionId: dto.assessmentDefinitionId,
        isActive: true,
      },
      include: { assessmentDefinition: { select: { maxScore: true } } },
    });
    if (mappings.length !== dto.assessmentCloMappingIds.length) {
      const found = new Set(mappings.map((m) => m.id));
      const missing = dto.assessmentCloMappingIds.filter((id) => !found.has(id));
      throw new NotFoundException(
        `Active CLO mapping(s) not found in assessment ${dto.assessmentDefinitionId}: ${missing.join(', ')}`,
      );
    }

    const recordIds = dto.entries.map((entry) => entry.studentCourseRecordId);
    const records = await this.prisma.studentCourseRecord.findMany({
      where: { id: { in: recordIds }, courseId: dto.courseId, isActive: true },
      select: { id: true },
    });
    const validRecordIds = new Set(records.map((r) => r.id));

    const errors: string[] = [];
    const seen = new Set<string>();
    for (const entry of dto.entries) {
      const id = entry.studentCourseRecordId;
      if (seen.has(id)) {
        errors.push(`${id}: listed more than once`);
        continue;
      }
      seen.add(id);
      if (!validRecordIds.has(id)) {
        errors.push(`${id}: active student course record not found in this course`);
        continue;
      }
      const presenceError = this.scorePresenceError(entry.status, entry.score);
      if (presenceError) {
        errors.push(`${id}: ${presenceError}`);
        continue;
      }
      if (entry.score === undefined) continue;
      const tooLow = mappings
        .map((mapping) => ({
          id: mapping.id,
          max: resolveEffectiveMax(
            mapping.maxScoreOverride,
            mapping.assessmentDefinition.maxScore,
          ),
        }))
        .filter(({ max }) => max.lessThan(entry.score!));
      if (tooLow.length > 0) {
        errors.push(
          `${id}: score ${entry.score} exceeds the maximum of CLO mapping ${tooLow
            .map(({ id: mappingId, max }) => `${mappingId} (${max.toString()})`)
            .join(', ')}`,
        );
      }
    }
    if (errors.length > 0) {
      const shown = errors.slice(0, MAX_REPORTED_ERRORS);
      const more = errors.length - shown.length;
      throw new BadRequestException(
        `No scores were saved — ${errors.length} problem(s): ${shown.join('; ')}${more > 0 ? `; +${more} more` : ''}`,
      );
    }

    const operations = mappings.flatMap((mapping) =>
      dto.entries.map((entry) => {
        const data = {
          score: entry.score ?? null,
          status: entry.status,
          assessmentCloMappingId: mapping.id,
          studentCourseRecordId: entry.studentCourseRecordId,
        };
        return this.prisma.studentAssessmentScore.upsert({
          where: {
            assessmentCloMappingId_studentCourseRecordId: {
              assessmentCloMappingId: mapping.id,
              studentCourseRecordId: entry.studentCourseRecordId,
            },
          },
          update: data,
          create: data,
        });
      }),
    );
    await this.prisma.$transaction(operations);

    return {
      mappingCount: mappings.length,
      entryCount: dto.entries.length,
      written: operations.length,
    };
  }

  findAllByMapping(assessmentCloMappingId: string) {
    return this.prisma.studentAssessmentScore.findMany({
      where: { assessmentCloMappingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // The guard only proves the caller may act on courseId, so the record must
  // be checked against that same course — 404 like assertBelongsToCourse, so
  // another course's record ids can't be probed.
  private async assertStudentCourseRecordInCourse(
    studentCourseRecordId: string,
    courseId: string,
  ) {
    const record = await this.prisma.studentCourseRecord.findUnique({
      where: { id: studentCourseRecordId },
      select: { courseId: true, isActive: true },
    });
    if (!record?.isActive) {
      throw new NotFoundException(
        `Active student course record ${studentCourseRecordId} not found`,
      );
    }
    if (record.courseId !== courseId) {
      throw new NotFoundException(
        `Student course record ${studentCourseRecordId} not found in course ${courseId}`,
      );
    }
  }

  // Mirrors the DB comment on StudentAssessmentScore.score: null iff
  // status is not GRADED. Enforced here (service layer), not a DB CHECK
  // constraint — same tradeoff CourseAssessmentCloScore already accepts
  // elsewhere in this schema.
  private assertScorePresenceMatchesStatus(status: string, score: number | undefined) {
    const error = this.scorePresenceError(status, score);
    if (error) throw new BadRequestException(error);
  }

  private scorePresenceError(status: string, score: number | undefined): string | null {
    if (status === 'GRADED' && score === undefined) {
      return 'score is required when status is GRADED';
    }
    if (status !== 'GRADED' && score !== undefined) {
      return `score must be omitted when status is ${status}`;
    }
    return null;
  }
}
