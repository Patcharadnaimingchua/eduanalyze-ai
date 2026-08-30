import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssessmentCloMappingService } from './assessment-clo-mapping.service';
import { UpsertStudentAssessmentScoreDto } from './dto/upsert-student-assessment-score.dto';

@Injectable()
export class StudentAssessmentScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assessmentCloMappingService: AssessmentCloMappingService,
  ) {}

  async upsert(dto: UpsertStudentAssessmentScoreDto) {
    await this.assessmentCloMappingService.assertBelongsToCourse(
      dto.assessmentCloMappingId,
      dto.courseId,
    );
    await this.assertStudentCourseRecordExists(dto.studentCourseRecordId);
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

  findAllByMapping(assessmentCloMappingId: string) {
    return this.prisma.studentAssessmentScore.findMany({
      where: { assessmentCloMappingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async assertStudentCourseRecordExists(studentCourseRecordId: string) {
    const record = await this.prisma.studentCourseRecord.findUnique({
      where: { id: studentCourseRecordId },
    });
    if (!record || !record.isActive) {
      throw new NotFoundException(
        `Active student course record ${studentCourseRecordId} not found`,
      );
    }
  }

  // Mirrors the DB comment on StudentAssessmentScore.score: null iff
  // status is not GRADED. Enforced here (service layer), not a DB CHECK
  // constraint — same tradeoff CourseAssessmentCloScore already accepts
  // elsewhere in this schema.
  private assertScorePresenceMatchesStatus(status: string, score: number | undefined) {
    if (status === 'GRADED' && score === undefined) {
      throw new BadRequestException('score is required when status is GRADED');
    }
    if (status !== 'GRADED' && score !== undefined) {
      throw new BadRequestException(`score must be omitted when status is ${status}`);
    }
  }
}
