import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { RequestUser } from '../../auth/request-user.interface';
import { LearningPathService } from '../learning-path/learning-path.service';
import { LearningPathPlanService } from './learning-path-plan.service';

const user = { userId: 'u1' } as RequestUser;

function build(availableCourseIds: string[]) {
  const prisma = {
    studentPlannedCourse: {
      findMany: jest.fn(),
      deleteMany: jest.fn().mockReturnValue('delete-op'),
      createMany: jest.fn().mockReturnValue('create-op'),
    },
    $transaction: jest.fn().mockResolvedValue(undefined),
  };
  const profiles = { findByUserId: jest.fn().mockResolvedValue({ id: 'p1' }) };
  const learningPath = {
    getLearningPath: jest.fn().mockResolvedValue({
      availableCourses: availableCourseIds.map((courseId) => ({ courseId })),
    }),
  };
  const service = new LearningPathPlanService(
    prisma as unknown as PrismaService,
    profiles as unknown as StudentProfileService,
    learningPath as unknown as LearningPathService,
  );
  return { service, prisma, learningPath };
}

describe('LearningPathPlanService', () => {
  it('getMyPlan returns null when nothing is saved', async () => {
    const { service, prisma } = build([]);
    prisma.studentPlannedCourse.findMany.mockResolvedValue([]);
    await expect(service.getMyPlan(user)).resolves.toBeNull();
  });

  it('getMyPlan returns ids in saved order, scoped to the caller profile', async () => {
    const { service, prisma } = build([]);
    prisma.studentPlannedCourse.findMany.mockResolvedValue([{ courseId: 'b' }, { courseId: 'a' }]);
    await expect(service.getMyPlan(user)).resolves.toEqual({ courseIds: ['b', 'a'] });
    expect(prisma.studentPlannedCourse.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentProfileId: 'p1' } }),
    );
  });

  it('saveMyPlan rejects courses outside availableCourses and writes nothing', async () => {
    const { service, prisma } = build(['a']);
    await expect(service.saveMyPlan(user, { courseIds: ['a', 'x'] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('saveMyPlan replaces the plan atomically with positions in order', async () => {
    const { service, prisma } = build(['a', 'b']);
    await expect(service.saveMyPlan(user, { courseIds: ['b', 'a'] })).resolves.toEqual({
      courseIds: ['b', 'a'],
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(['delete-op', 'create-op']);
    expect(prisma.studentPlannedCourse.createMany).toHaveBeenCalledWith({
      data: [
        { studentProfileId: 'p1', courseId: 'b', position: 0 },
        { studentProfileId: 'p1', courseId: 'a', position: 1 },
      ],
    });
  });

  it('saveMyPlan accepts an empty plan (clears the saved rows)', async () => {
    const { service, prisma } = build([]);
    await service.saveMyPlan(user, { courseIds: [] });
    expect(prisma.studentPlannedCourse.createMany).toHaveBeenCalledWith({ data: [] });
  });
});
