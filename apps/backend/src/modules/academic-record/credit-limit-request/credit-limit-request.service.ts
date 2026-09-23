import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { RequestUser } from '../../auth/request-user.interface';
import { CreateCreditLimitRequestDto } from './dto/create-credit-limit-request.dto';

// Self-declared credit-limit exceptions — see the enum doc comment in
// schema.prisma. Always resolved from the caller's own JWT (no route
// param for studentProfileId), since this is student self-service only,
// same shape as StudentCourseRecordService's "own records" methods.
@Injectable()
export class CreditLimitRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfileService: StudentProfileService,
  ) {}

  async getMyRequest(user: RequestUser) {
    const profile = await this.studentProfileService.findByUserId(user.userId);
    return this.prisma.studentCreditLimitRequest.findUnique({
      where: { studentProfileId: profile.id },
    });
  }

  async upsertMyRequest(user: RequestUser, dto: CreateCreditLimitRequestDto) {
    const profile = await this.studentProfileService.findByUserId(user.userId);
    return this.prisma.studentCreditLimitRequest.upsert({
      where: { studentProfileId: profile.id },
      create: { studentProfileId: profile.id, type: dto.type, reason: dto.reason },
      update: { type: dto.type, reason: dto.reason },
    });
  }

  async deleteMyRequest(user: RequestUser) {
    const profile = await this.studentProfileService.findByUserId(user.userId);
    await this.prisma.studentCreditLimitRequest.deleteMany({
      where: { studentProfileId: profile.id },
    });
  }
}
