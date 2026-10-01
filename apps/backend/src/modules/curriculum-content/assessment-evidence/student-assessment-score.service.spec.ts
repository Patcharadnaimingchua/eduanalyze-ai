import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssessmentCloMappingService } from './assessment-clo-mapping.service';
import { AssessmentDefinitionService } from './assessment-definition.service';
import { BulkUpsertStudentAssessmentScoresDto } from './dto/bulk-upsert-student-assessment-scores.dto';
import {
  AssessmentScoreStatusDto,
  UpsertStudentAssessmentScoreDto,
} from './dto/upsert-student-assessment-score.dto';
import { StudentAssessmentScoreService } from './student-assessment-score.service';

const dto: UpsertStudentAssessmentScoreDto = {
  courseId: 'course-A',
  assessmentCloMappingId: 'mapping-1',
  studentCourseRecordId: 'record-1',
  status: AssessmentScoreStatusDto.GRADED,
  score: 8,
};

function setup(record: { courseId: string; isActive: boolean } | null) {
  const prisma = {
    studentCourseRecord: { findUnique: jest.fn().mockResolvedValue(record) },
    studentAssessmentScore: { upsert: jest.fn().mockResolvedValue({ id: 'score-1' }) },
  };
  const mappingService = { assertBelongsToCourse: jest.fn().mockResolvedValue({}) };
  const service = new StudentAssessmentScoreService(
    prisma as unknown as PrismaService,
    mappingService as unknown as AssessmentCloMappingService,
    { assertBelongsToCourse: jest.fn().mockResolvedValue({}) } as unknown as AssessmentDefinitionService,
  );
  return { service, prisma };
}

describe('StudentAssessmentScoreService.upsert', () => {
  it('rejects a student course record from a different course', async () => {
    const { service, prisma } = setup({ courseId: 'course-B', isActive: true });

    await expect(service.upsert(dto)).rejects.toThrow(NotFoundException);
    expect(prisma.studentAssessmentScore.upsert).not.toHaveBeenCalled();
  });

  it('writes the score when the record belongs to the course', async () => {
    const { service, prisma } = setup({ courseId: 'course-A', isActive: true });

    await service.upsert(dto);

    expect(prisma.studentAssessmentScore.upsert).toHaveBeenCalledWith({
      where: {
        assessmentCloMappingId_studentCourseRecordId: {
          assessmentCloMappingId: 'mapping-1',
          studentCourseRecordId: 'record-1',
        },
      },
      update: expect.objectContaining({ score: 8, status: 'GRADED' }),
      create: expect.objectContaining({ score: 8, status: 'GRADED' }),
    });
  });

  it.each([
    ['missing', null],
    ['inactive', { courseId: 'course-A', isActive: false }],
  ])('rejects a %s record', async (_label, record) => {
    const { service, prisma } = setup(record);

    await expect(service.upsert(dto)).rejects.toThrow(NotFoundException);
    expect(prisma.studentAssessmentScore.upsert).not.toHaveBeenCalled();
  });
});

const D = (n: number) => new Prisma.Decimal(n);

function bulkSetup(opts: {
  mappings?: { id: string; maxScoreOverride: Prisma.Decimal | null }[];
  recordIds?: string[];
  transaction?: jest.Mock;
}) {
  const mappings = (opts.mappings ?? [
    { id: 'm1', maxScoreOverride: null },
    { id: 'm2', maxScoreOverride: null },
  ]).map((m) => ({ ...m, assessmentDefinition: { maxScore: D(10) } }));
  const upsert = jest.fn((args: unknown) => args);
  const prisma = {
    assessmentCloMapping: { findMany: jest.fn().mockResolvedValue(mappings) },
    studentCourseRecord: {
      findMany: jest
        .fn()
        .mockResolvedValue((opts.recordIds ?? ['r1', 'r2']).map((id) => ({ id }))),
    },
    studentAssessmentScore: { upsert },
    $transaction: opts.transaction ?? jest.fn().mockResolvedValue([]),
  };
  const service = new StudentAssessmentScoreService(
    prisma as unknown as PrismaService,
    {} as unknown as AssessmentCloMappingService,
    { assertBelongsToCourse: jest.fn().mockResolvedValue({}) } as unknown as AssessmentDefinitionService,
  );
  return { service, prisma, upsert };
}

const bulkDto = (
  entries: BulkUpsertStudentAssessmentScoresDto['entries'],
  ids = ['m1', 'm2'],
): BulkUpsertStudentAssessmentScoresDto => ({
  courseId: 'course-A',
  assessmentDefinitionId: 'def-1',
  assessmentCloMappingIds: ids,
  entries,
});
const graded = (id: string, score: number) => ({
  studentCourseRecordId: id,
  status: AssessmentScoreStatusDto.GRADED,
  score,
});

describe('StudentAssessmentScoreService.bulkUpsert', () => {
  it('writes every entry to every mapping in ONE transaction', async () => {
    const { service, prisma, upsert } = bulkSetup({});

    const result = await service.bulkUpsert(bulkDto([graded('r1', 8), graded('r2', 5)]));

    expect(upsert).toHaveBeenCalledTimes(4);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect((prisma.$transaction.mock.calls[0][0] as unknown[]).length).toBe(4);
    expect(result).toEqual({ mappingCount: 2, entryCount: 2, written: 4 });
  });

  it.each([
    ['a record outside the course', bulkDto([graded('r1', 8), graded('ghost', 5)])],
    ['GRADED without a score', bulkDto([graded('r1', 8), { studentCourseRecordId: 'r2', status: AssessmentScoreStatusDto.GRADED }])],
    ['a score on an ABSENT row', bulkDto([{ studentCourseRecordId: 'r1', status: AssessmentScoreStatusDto.ABSENT, score: 3 }])],
    ['a duplicated record', bulkDto([graded('r1', 8), graded('r1', 9)])],
    ['a score above the maximum', bulkDto([graded('r1', 11)])],
  ])('rejects %s with 400 and writes nothing', async (_label, dto) => {
    const { service, prisma, upsert } = bulkSetup({});

    await expect(service.bulkUpsert(dto)).rejects.toThrow(BadRequestException);
    expect(upsert).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('checks the score against each mapping\'s own maxScoreOverride', async () => {
    const { service, upsert } = bulkSetup({
      mappings: [
        { id: 'm1', maxScoreOverride: null },
        { id: 'm2', maxScoreOverride: D(4) },
      ],
    });

    await expect(service.bulkUpsert(bulkDto([graded('r1', 8)]))).rejects.toThrow(/exceeds the maximum of CLO mapping m2 \(4\)/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('reports every problem in one message', async () => {
    const { service } = bulkSetup({});

    await expect(
      service.bulkUpsert(bulkDto([graded('ghost', 1), graded('r1', 99)])),
    ).rejects.toThrow(/2 problem\(s\)/);
  });

  it('404s when a mapping is not an active mapping of the assessment', async () => {
    const { service, upsert } = bulkSetup({ mappings: [{ id: 'm1', maxScoreOverride: null }] });

    await expect(service.bulkUpsert(bulkDto([graded('r1', 8)]))).rejects.toThrow(NotFoundException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('propagates a transaction failure (nothing is partially reported as saved)', async () => {
    const { service } = bulkSetup({ transaction: jest.fn().mockRejectedValue(new Error('db down')) });

    await expect(service.bulkUpsert(bulkDto([graded('r1', 8)]))).rejects.toThrow('db down');
  });
});
