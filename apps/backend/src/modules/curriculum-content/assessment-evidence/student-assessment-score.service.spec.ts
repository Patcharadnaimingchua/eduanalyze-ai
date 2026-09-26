import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssessmentCloMappingService } from './assessment-clo-mapping.service';
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
