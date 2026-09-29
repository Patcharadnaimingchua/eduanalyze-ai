import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { RequestUser } from '../../auth/request-user.interface';
import { LearningPathService } from '../learning-path/learning-path.service';
import { SaveLearningPathPlanDto } from './dto/save-learning-path-plan.dto';

// Saved "next semester" plan, always resolved from the caller's own JWT
// (student self-service, same shape as CreditLimitRequestService). The plan
// is advisory working data: it is never fed into credit-checker/achievement.
@Injectable()
export class LearningPathPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfileService: StudentProfileService,
    private readonly learningPathService: LearningPathService,
  ) {}

  // null = nothing saved yet, so the client falls back to the recommendation.
  async getMyPlan(user: RequestUser): Promise<{ courseIds: string[] } | null> {
    const profile = await this.studentProfileService.findByUserId(user.userId);
    const rows = await this.prisma.studentPlannedCourse.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { position: 'asc' },
      select: { courseId: true },
    });
    return rows.length === 0 ? null : { courseIds: rows.map((r) => r.courseId) };
  }

  async saveMyPlan(user: RequestUser, dto: SaveLearningPathPlanDto) {
    const profile = await this.studentProfileService.findByUserId(user.userId);
    // Eligibility (not passed yet, prerequisites met) is already computed
    // server-side by the learning-path report — reuse it, don't re-derive.
    const report = await this.learningPathService.getLearningPath(profile.id, user);
    const eligible = new Set(report.availableCourses.map((c) => c.courseId));
    const ineligible = dto.courseIds.filter((id) => !eligible.has(id));
    if (ineligible.length > 0) {
      throw new BadRequestException(
        'Some courses are not available to plan (already passed or prerequisites unmet)',
      );
    }

    await this.prisma.$transaction([
      this.prisma.studentPlannedCourse.deleteMany({ where: { studentProfileId: profile.id } }),
      this.prisma.studentPlannedCourse.createMany({
        data: dto.courseIds.map((courseId, position) => ({
          studentProfileId: profile.id,
          courseId,
          position,
        })),
      }),
    ]);
    return { courseIds: dto.courseIds };
  }

  async deleteMyPlan(user: RequestUser) {
    const profile = await this.studentProfileService.findByUserId(user.userId);
    await this.prisma.studentPlannedCourse.deleteMany({
      where: { studentProfileId: profile.id },
    });
  }
}
